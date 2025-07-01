import { detachPromise, promises, withTimer } from '@common/common';
import { splitFileNameFromPath } from '@common/fileops';
import {
    ActionModule,
    BranchingModule,
    ProcessingModule,
    ProcessingModuleType,
    ProcessingRequest,
    ProcessingSortOption,
} from '@shared/common.types';
import { ProcessingError } from '@util/errors';
import { addStat, sendFeLog, updateTaskProgress } from '@util/ipc';
import { CommonContext, FileOptions, FileWithMeta, ModuleHandler } from '@util/types';
import { addEventLogForReport, fileListToFileOptions } from './handler.helpers';
import { MODULE_MAP } from './modules/moduleMap';
import branchingHandler from './modules/branching.handler';

let globalTaskId = 0;
/** Max number of modules to process, to protect against looping */
const MAX_MODULE_LENGTH = 100;

/** Top level does not know what this is. Gives modules places to store data. */
type ModuleDataStore = Record<string, object>;

/** Store on done callbacks to run at the end of processing */
type OnDoneMap = Record<string, ModuleHandler['onDone']>;

/**
 * Full flow for running a pipeline.
 */
export const runPipelineForFiles = async (params: ProcessingRequest) => {
    globalTaskId++;
    const taskId = globalTaskId;
    const { filePaths, pipeline } = params;

    if (filePaths.length === 0 || pipeline.processingModules.length === 0) return;

    const pipelineId = pipeline.id!;

    let timeTaken = 0;

    /** Track log only if we need to */
    const hasReporter = pipeline.processingModules.find((m) => m.type === ProcessingModuleType.report);
    const commonContext: CommonContext = {
        pipelineId: pipeline.id,
        ...(hasReporter ? { eventLog: [], pipelineName: pipeline.name } : {}),
    };

    const mainUpdate = (mainName: string, progress: number, subName?: string, subProgress?: number) => {
        updateTaskProgress({
            id: taskId,
            pipelineId,
            name: mainName,
            progress,
            subName,
            subProgress,
        });
    };

    let handled = 0;
    let progress = 0;

    const fileOptions: FileOptions = fileListToFileOptions(
        pipeline.sortOption === ProcessingSortOption.alphabetical ? filePaths.sort() : filePaths,
    );

    const modulesById = pipeline.processingModules.reduce<Record<string, ProcessingModule>>((a, v) => {
        a[v.id] = v;
        return a;
    }, {});

    const onDoneMap: OnDoneMap = {};

    sendFeLog(`Requested ${pipeline.name} with ${filePaths.length} files`);

    await withTimer(
        async () => {
            /** We don't know what they are up here, we're not concerned. Modules will handle. */
            const moduleDataStores: ModuleDataStore = {};

            await promises.each(fileOptions.filesWithMeta, async (fileWithMeta) => {
                let nextModule: ProcessingModule | null = pipeline.processingModules[0];
                let modulesIterated = 0;
                let handling = true;

                const { fileName } = splitFileNameFromPath(fileWithMeta.filePath);

                mainUpdate(fileName, progress);

                try {
                    while (!!nextModule && modulesIterated < MAX_MODULE_LENGTH && handling) {
                        modulesIterated++;

                        if (nextModule.type === ProcessingModuleType.branch) {
                            nextModule = await runBranchingModuleForFile({
                                branchingModule: nextModule,
                                fileWithMeta,
                                modulesById,
                            });
                            continue;
                        }

                        await runModuleForFile({
                            processingModule: nextModule,
                            fileWithMeta,
                            commonContext,
                            moduleDataStores,
                            onDoneMap,
                            onProgress: (_, subProgress) =>
                                mainUpdate(fileName, progress, nextModule?.type, subProgress),
                        });

                        /** Immediately cease all handling if a filter module eliminated this file */
                        if (fileWithMeta.remove) handling = false;

                        const searchModule: ProcessingModule | null = nextModule.nextModule
                            ? modulesById[nextModule.nextModule]
                            : null;
                        nextModule = searchModule ?? null;
                    }
                } catch (e) {
                    if (e instanceof ProcessingError) {
                        /* ignore for now, unless specified to not ignore errors */
                    } else {
                        /* real error */
                        console.error('[runPipeline]', e);
                        throw e;
                    }
                }

                handled++;
                progress = Math.ceil((handled / filePaths.length) * 100);

                mainUpdate(fileName, progress);
            });

            /** Run all onDone handlers */
            await promises.each(Object.entries(onDoneMap), async ([moduleId, cb]) => {
                const clientOptions = (modulesById[moduleId] as ActionModule).options;
                await cb?.({ context: commonContext, clientOptions }, moduleDataStores[moduleId]);
            });
        },
        (time) => {
            timeTaken = time;

            sendFeLog(`Completed ${pipeline.name} in ${time}ms`);
        },
    );

    detachPromise({
        cb: async () => {
            addStat({
                pipelineUuid: pipeline.id,
                stats: [
                    {
                        stat: 'times_ran',
                    },
                    {
                        stat: 'time_taken',
                        amount: timeTaken,
                    },
                    {
                        stat: 'files_processed',
                        amount: handled,
                    },
                ],
            });
        },
    });
};

export const runBranchingModuleForFile = async ({
    branchingModule,
    fileWithMeta,
    modulesById,
}: {
    fileWithMeta: FileWithMeta;
    branchingModule: BranchingModule;
    modulesById: Record<string, ProcessingModule>;
}) => {
    const matchingModuleId: string | null = await branchingHandler(branchingModule, fileWithMeta.filePath);

    const searchModule: ProcessingModule | null = matchingModuleId ? modulesById[matchingModuleId] : null;

    return searchModule;
};

/**
 * Run non branching module.
 */
export const runModuleForFile = async <T extends object = {}>({
    processingModule,
    fileWithMeta,
    commonContext,
    moduleDataStores,
    onDoneMap,
    onProgress,
}: {
    processingModule: ProcessingModule;
    fileWithMeta: FileWithMeta;
    commonContext: CommonContext & T;
    moduleDataStores?: ModuleDataStore;
    onDoneMap?: OnDoneMap;
    onProgress?: (label: string, progress: number) => void;
}) => {
    if (processingModule.type === ProcessingModuleType.branch) return;

    const { fileName } = splitFileNameFromPath(fileWithMeta.filePath);
    let ignoreError = false;
    try {
        const moduleHandler = MODULE_MAP[processingModule.type];

        if (!moduleHandler) throw new ProcessingError(`No handler for module ${processingModule.type}`);

        if (processingModule.options.ignoreErrors) ignoreError = true;

        const { filter, onDone, handler } = moduleHandler;
        const shouldHandle = filter ? await filter(fileWithMeta.filePath) : true;

        /** File doesn't apply for this module, move on */
        if (!shouldHandle && processingModule.options.skipPreviouslyFailed) fileWithMeta.remove = true;
        if (!shouldHandle) return;

        if (moduleDataStores && !moduleDataStores[processingModule.id]) moduleDataStores[processingModule.id] = {};

        await handler?.(
            fileWithMeta,
            {
                context: commonContext,
                clientOptions: processingModule.options,
                onProgress,
            },
            moduleDataStores?.[processingModule.id] ?? {},
        );

        /** Add to onDone map for final runs */
        if (onDone && onDoneMap && !onDoneMap[processingModule.id]) onDoneMap[processingModule.id] = onDone;
    } catch (e: any) {
        addEventLogForReport({ context: commonContext }, fileName, 'errored', e.message);
        if (!ignoreError) throw e;
    } finally {
    }
};

export const handleClientMessage = (message: string) => {
    console.log(`[client-message] ${message}`);
};
