#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const util = require('util');
const crypto = require('crypto');

const uiRoot = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(uiRoot, '..');
const uiTsconfigPath = path.join(uiRoot, 'tsconfig.json');

process.env.TS_NODE_PROJECT = uiTsconfigPath;
process.env.APP_IS_DEV = process.env.APP_IS_DEV || 'yes';

require(require.resolve('ts-node/register/transpile-only', { paths: [repoRoot] }));

const tsconfigPaths = require(require.resolve('tsconfig-paths', { paths: [uiRoot, repoRoot] }));
const { compilerOptions } = require(uiTsconfigPath);

tsconfigPaths.register({
    baseUrl: uiRoot,
    paths: compilerOptions.paths,
});

const inspect = (value) =>
    util.inspect(value, {
        depth: 6,
        colors: false,
        compact: false,
        breakLength: 120,
    });

const log = (label, value) => {
    if (typeof value === 'undefined') {
        console.log(`\n=== ${label} ===`);
        return;
    }

    console.log(`\n=== ${label} ===`);
    console.log(typeof value === 'string' ? value : inspect(value));
};

const summarizeTags = (probeResult) => ({
    format: {
        filename: probeResult?.format?.filename,
        format_name: probeResult?.format?.format_name,
        duration: probeResult?.format?.duration,
        size: probeResult?.format?.size,
        tags: probeResult?.format?.tags ?? null,
    },
    streams: Array.isArray(probeResult?.streams)
        ? probeResult.streams.map((stream) => ({
              index: stream.index,
              codec_type: stream.codec_type,
              codec_name: stream.codec_name,
              tags: stream.tags ?? null,
          }))
        : [],
});

const getFileHash = async (filePath) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);

    await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', resolve);
        stream.on('error', reject);
    });

    return hash.digest('hex');
};

const getStatsSummary = async (filePath) => {
    const stats = await fsp.stat(filePath);

    return {
        filePath,
        size: stats.size,
        mtime: stats.mtime.toISOString(),
        ctime: stats.ctime.toISOString(),
    };
};

const resolveDefaultTarget = async () => {
    const testDataDir = path.join(uiRoot, 'testData');
    const entries = await fsp.readdir(testDataDir);
    const preferred = entries.find((entry) => entry.toLowerCase().endsWith('.mp4'));

    if (!preferred) throw new Error(`No .mp4 file found in ${testDataDir}`);

    return path.join(testDataDir, preferred);
};

const createScratchCase = async (sourcePath, label) => {
    const scratchDir = await fsp.mkdtemp(path.join(os.tmpdir(), `hutil-name-tag-${label}-`));
    const scratchPath = path.join(scratchDir, path.basename(sourcePath));
    await fsp.copyFile(sourcePath, scratchPath);

    return { scratchDir, scratchPath };
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createPipeline = (commonTypes) => ({
    name: 'tagmeta-debug',
    modified: new Date().toISOString(),
    created: new Date().toISOString(),
    color: null,
    manualRanking: 100,
    sortOption: commonTypes.ProcessingSortOption.none,
    id: 'debug-pipeline-id',
    processingModules: [
        {
            id: 'debug-metadata-module-id',
            type: commonTypes.ProcessingModuleType.metadata,
            options: {
                value: '',
            },
        },
    ],
});

const main = async () => {
    const targetPathArg = process.argv[2];
    const sourceFilePath = targetPathArg ? path.resolve(targetPathArg) : await resolveDefaultTarget();

    const fileopsModule = require(path.join(uiRoot, 'Electron/packages/fileops/index.ts'));
    const fileopsUtilModule = require(path.join(uiRoot, 'Electron/packages/fileops/util.ts'));
    const {
        ffMeta,
        getTempName,
        removeExt,
        splitFileNameFromPath,
        parseStringToTags,
    } = fileopsModule;
    const {
        resolveBinaryPath,
        createModuleBinaryLoader,
    } = require(path.join(uiRoot, 'Electron/packages/fileops/binaryPathResolver.ts'));
    const { fileNameSafeTitleReplace } = require(path.join(
        uiRoot,
        'Electron/operations/modules/nameTag.helpers.ts',
    ));
    const nameTagHandler = require(path.join(uiRoot, 'Electron/operations/modules/nameTag.handler.ts')).default;
    const handlerHelpers = require(path.join(uiRoot, 'Electron/operations/handler.helpers.ts'));
    const commonTypes = require(path.join(uiRoot, 'common/common.types.ts'));
    const { MODULE_MAP } = require(path.join(uiRoot, 'Electron/operations/modules/moduleMap.ts'));
    const handlerModule = require(path.join(uiRoot, 'Electron/operations/handler.ts'));
    const aqueductModule = require(path.join(uiRoot, 'Electron/operations/aqueduct.ts'));
    const ipcModule = require(path.join(uiRoot, 'Electron/util/ipc.ts'));
    const eventEmitter = require(path.join(uiRoot, 'Electron/util/events.ts')).default;
    const { IpcMessageType } = require(path.join(uiRoot, 'common/common.constants.ts'));

    const resolvedFfprobePath = resolveBinaryPath({
        candidateLoaders: [createModuleBinaryLoader('@ffprobe-installer/ffprobe', (loadedModule) => loadedModule?.path)],
        fallbackCommand: 'ffprobe',
    });
    const resolvedFfmpegPath = resolveBinaryPath({
        candidateLoaders: [createModuleBinaryLoader('ffmpeg-static', (loadedModule) => loadedModule)],
        fallbackCommand: 'ffmpeg',
    });

    log('Runtime Paths', {
        repoRoot,
        uiRoot,
        sourceFilePath,
        resolvedFfprobePath,
        resolvedFfmpegPath,
    });

    const stageTrace = {
        currentStage: null,
        eventLogs: {},
        progressEvents: {},
        rendererMessages: {},
        moduleCalls: {},
    };

    const pushTrace = (bucket, value) => {
        const stageName = stageTrace.currentStage ?? 'unscoped';
        if (!stageTrace[bucket][stageName]) stageTrace[bucket][stageName] = [];
        stageTrace[bucket][stageName].push(value);
    };

    const originalReadTags = ffMeta.readTags;
    const originalWriteTags = ffMeta.writeTags;
    const originalReplaceFile = fileopsUtilModule.replaceFile;
    const originalWithUTimes = fileopsModule.withUTimes;
    const originalAddEventLogForReport = handlerHelpers.addEventLogForReport;
    const originalMetadataHandler = MODULE_MAP[commonTypes.ProcessingModuleType.metadata];

    ffMeta.readTags = async (...args) => {
        log(`[${stageTrace.currentStage}] ffMeta.readTags input`, args[0]);
        const result = await originalReadTags(...args);
        log(`[${stageTrace.currentStage}] ffMeta.readTags output`, summarizeTags(result));
        return result;
    };

    ffMeta.writeTags = async (...args) => {
        const [filePath, tags] = args;
        const tempOutputPath = getTempName(filePath);

        log(`[${stageTrace.currentStage}] ffMeta.writeTags input`, {
            filePath,
            tags,
            tempOutputPath,
        });

        const result = await originalWriteTags(...args);

        log(`[${stageTrace.currentStage}] ffMeta.writeTags post-run temp exists`, {
            tempOutputPath,
            exists: fs.existsSync(tempOutputPath),
        });

        if (fs.existsSync(tempOutputPath)) {
            log(`[${stageTrace.currentStage}] ffMeta.writeTags temp stats`, await getStatsSummary(tempOutputPath));
            log(
                `[${stageTrace.currentStage}] ffMeta.writeTags temp probe`,
                summarizeTags(await originalReadTags(tempOutputPath)),
            );
        }

        return result;
    };

    fileopsUtilModule.replaceFile = async (...args) => {
        const [oldPath, newPath] = args;
        log(`[${stageTrace.currentStage}] replaceFile input`, {
            oldPath,
            newPath,
            oldExists: fs.existsSync(oldPath),
            newExists: fs.existsSync(newPath),
        });

        const result = await originalReplaceFile(...args);

        log(`[${stageTrace.currentStage}] replaceFile output`, {
            oldPath,
            newPath,
            oldExists: fs.existsSync(oldPath),
            newExists: fs.existsSync(newPath),
        });

        return result;
    };

    fileopsModule.withUTimes = async (cb, filePath) => {
        log(`[${stageTrace.currentStage}] withUTimes input`, {
            filePath,
            before: await getStatsSummary(filePath),
        });

        const result = await originalWithUTimes(async () => {
            log(`[${stageTrace.currentStage}] withUTimes callback entry`, {
                filePath,
                tempOutputPath: getTempName(filePath),
            });
            return cb();
        }, filePath);

        log(`[${stageTrace.currentStage}] withUTimes output`, {
            filePath,
            after: await getStatsSummary(filePath),
        });

        return result;
    };

    handlerHelpers.addEventLogForReport = (...args) => {
        const [, fileName, operation, target] = args;
        pushTrace('eventLogs', { fileName, operation, target });
        return originalAddEventLogForReport(...args);
    };

    MODULE_MAP[commonTypes.ProcessingModuleType.metadata] = {
        ...originalMetadataHandler,
        filter: async (filePath) => {
            const result = await originalMetadataHandler.filter?.(filePath);
            pushTrace('moduleCalls', { kind: 'filter', filePath, result });
            return result;
        },
        handler: async (fileWithMeta, opts, store) => {
            pushTrace('moduleCalls', { kind: 'handler:start', filePath: fileWithMeta.filePath, clientOptions: opts.clientOptions });
            const result = await originalMetadataHandler.handler?.(fileWithMeta, opts, store);
            pushTrace('moduleCalls', { kind: 'handler:end', filePath: fileWithMeta.filePath });
            return result;
        },
    };

    const pipeline = createPipeline(commonTypes);

    const fakeMainWindow = {
        webContents: {
            send(channel, payload) {
                if (channel === IpcMessageType.rendererMessage) {
                    const parsedPayload = JSON.parse(payload);
                    pushTrace('rendererMessages', {
                        direction: 'main->renderer',
                        channel,
                        payload: parsedPayload,
                    });

                    const response =
                        parsedPayload.type === 'requestPipeline'
                            ? {
                                  type: 'pipelineData',
                                  messageId: parsedPayload.messageId,
                                  pipeline,
                              }
                            : {
                                  type: 'confirm',
                                  messageId: parsedPayload.messageId,
                              };

                    setImmediate(() => {
                        pushTrace('rendererMessages', {
                            direction: 'renderer->main',
                            channel,
                            payload: response,
                        });
                        eventEmitter.emit('rendererMessage', response);
                    });

                    return;
                }

                pushTrace('rendererMessages', {
                    direction: 'main->renderer',
                    channel,
                    payload: typeof payload === 'string' ? payload : inspect(payload),
                });
            },
        },
    };

    ipcModule.registerMainWindow(fakeMainWindow);

    const buildCaseContext = async (scratchPath) => {
        const tempOutputPath = getTempName(scratchPath);
        const initialStats = await getStatsSummary(scratchPath);
        const initialHash = await getFileHash(scratchPath);
        const { fileName } = splitFileNameFromPath(scratchPath);
        const pattern = '%artist% - %title%';
        const parsedTags = parseStringToTags(pattern, removeExt(fileName));
        const initialProbe = await originalReadTags(scratchPath);
        const existingTitle = initialProbe?.format?.tags?.title || '';
        const existingArtist = initialProbe?.format?.tags?.artist || '';
        const expectedFinalTags = parsedTags
            ? {
                  ...parsedTags,
                  title: fileNameSafeTitleReplace(parsedTags.title, existingTitle),
                  artist: fileNameSafeTitleReplace(parsedTags.artist, existingArtist),
              }
            : null;

        return {
            tempOutputPath,
            initialStats,
            initialHash,
            fileName,
            pattern,
            parsedTags,
            initialProbe,
            expectedFinalTags,
        };
    };

    const finalizeStage = async (stageName, scratchPath, context, extra = {}) => {
        await wait(50);

        const finalStats = await getStatsSummary(scratchPath);
        const finalHash = await getFileHash(scratchPath);
        const finalProbe = await originalReadTags(scratchPath);
        const finalTags = finalProbe?.format?.tags ?? {};
        const expectationCheck = {
            expectedFinalTags: context.expectedFinalTags,
            actualArtist: finalTags.artist,
            actualTitle: finalTags.title,
            matchesArtist: context.expectedFinalTags ? finalTags.artist === context.expectedFinalTags.artist : false,
            matchesTitle: context.expectedFinalTags ? finalTags.title === context.expectedFinalTags.title : false,
        };

        const summary = {
            stageName,
            filePath: scratchPath,
            fileMutation: {
                hashChanged: context.initialHash !== finalHash,
                initialHash: context.initialHash,
                finalHash,
                tempExistsAfterHandler: fs.existsSync(context.tempOutputPath),
            },
            initialStats: context.initialStats,
            finalStats,
            initialMetadata: summarizeTags(context.initialProbe),
            finalMetadata: summarizeTags(finalProbe),
            parsedTags: context.parsedTags,
            expectedFinalTags: context.expectedFinalTags,
            expectationCheck,
            eventLogEntries: stageTrace.eventLogs[stageName] ?? [],
            progressEvents: stageTrace.progressEvents[stageName] ?? [],
            rendererMessages: stageTrace.rendererMessages[stageName] ?? [],
            moduleCalls: stageTrace.moduleCalls[stageName] ?? [],
            ...extra,
        };

        log(`${stageName} Summary`, summary);

        return summary;
    };

    const runStage = async (stageName, executor) => {
        stageTrace.currentStage = stageName;
        stageTrace.eventLogs[stageName] = [];
        stageTrace.progressEvents[stageName] = [];
        stageTrace.rendererMessages[stageName] = [];
        stageTrace.moduleCalls[stageName] = [];

        const { scratchDir, scratchPath } = await createScratchCase(sourceFilePath, stageName);
        const context = await buildCaseContext(scratchPath);

        log(`${stageName} Scratch Copy`, {
            scratchDir,
            scratchPath,
            tempOutputPath: context.tempOutputPath,
        });

        log(`${stageName} Parse Preview`, {
            pattern: context.pattern,
            fileName: context.fileName,
            parsedTags: context.parsedTags,
            expectedFinalTags: context.expectedFinalTags,
        });

        let error = null;

        try {
            await executor({
                scratchDir,
                scratchPath,
                eventLog: [],
            });
        } catch (stageError) {
            error = {
                message: stageError.message,
                stack: stageError.stack,
            };
            log(`${stageName} Error`, error);
        }

        const summary = await finalizeStage(stageName, scratchPath, context, { error });

        if (summary.expectationCheck.matchesArtist !== true || summary.expectationCheck.matchesTitle !== true) {
            process.exitCode = 2;
        }

        if (error && process.exitCode !== 2) {
            process.exitCode = 1;
        }

        return summary;
    };

    const directSummary = await runStage('direct-handler', async ({ scratchPath, eventLog }) => {
        const filterResult = await nameTagHandler.filter?.(scratchPath);
        log('direct-handler filter result', filterResult);

        if (!filterResult) throw new Error(`Handler filter rejected ${scratchPath}`);

        await nameTagHandler.handler(
            { filePath: scratchPath },
            {
                onProgress: (label, progress) => {
                    pushTrace('progressEvents', { label, progress });
                    console.log(`[direct-handler:onProgress] ${label}: ${progress}`);
                },
                onSuccess: (message) => {
                    console.log(`[direct-handler:onSuccess] ${message ?? ''}`);
                },
                context: { eventLog },
            },
            {},
        );
    });

    const pipelineSummary = await runStage('pipeline-runner', async ({ scratchPath }) => {
        await handlerModule.runPipelineForFiles({
            pipeline,
            filePaths: [scratchPath],
        });
    });

    const aqueductSummary = await runStage('aqueduct-runner', async ({ scratchDir }) => {
        await aqueductModule.handleAqueductMessage({
            type: 'run',
            aqueduct: {
                id: 'debug-aqueduct-id',
                pipelineId: pipeline.id,
                name: 'debug-aqueduct',
                directories: [scratchDir],
            },
        });
    });

    log('Cross-Stage Summary', {
        directExpectation: directSummary.expectationCheck,
        pipelineExpectation: pipelineSummary.expectationCheck,
        aqueductExpectation: aqueductSummary.expectationCheck,
    });
};

main().catch((error) => {
    console.error('\n[HARNESS FATAL]', error);
    process.exit(1);
});
