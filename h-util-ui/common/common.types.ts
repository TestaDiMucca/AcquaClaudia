import { Rule } from './rules.types';

export enum ProcessingModuleType {
    datePrefix = 'Date Prefix',
    metadata = 'Metadata Tagging',
    compressImage = 'Compress Image',
    compressVideo = 'Compress Video',
    subfolder = 'Place in Directory',
    iterate = 'Iterate',
    filter = 'Filter',
    ocr = 'Text Parsing (OCR)',
    report = 'Report output',
    dynamicRename = 'Dynamic Rename',
    ruleFilter = 'Filter with Rules',
    branch = 'branch',
    runPipeline = 'runPipeline',
}

/** Options that work by switching on/off only */
export type ProcessingModuleBooleanOptions = {
    /** Ignores a module erroring and continues to process file */
    ignoreErrors?: boolean;
    /** @deprecated */
    skipPreviouslyFailed?: boolean;
    /** Inverts any boolean logic */
    inverse?: boolean;
};

export type ProcessingBranch = {
    rules: Rule;
    targetModule?: string;
};

interface BaseModule {
    id: string;
}

export interface BranchingModule extends BaseModule {
    type: ProcessingModuleType.branch;
    branches: ProcessingBranch[];
}

export interface ActionModule extends BaseModule {
    type: Exclude<ProcessingModuleType, 'branch'>;
    options: ProcessingModuleBooleanOptions & {
        value: string | number;
        rules?: Rule;
        dateMask?: string;
    };
    nextModule?: string;
}

export type ProcessingModule = BranchingModule | ActionModule;

export type Pipeline = {
    /** Should only be missing on new pipelines */
    id: string;
    name: string;
    created?: string;
    modified?: string;
    /** Used for gallery sorting */
    manualRanking?: number;
    processingModules: ProcessingModule[];
    /** Used for the card display */
    color?: string;
    /** Supplemented on load. todo: take out of this type */
    timesRan?: number;
};

export type Storage = {
    pipelines: Record<string, Pipeline>;
};

/**
 * @deprecated replaced by SQLite stats
 */
export type StatsStorage = {
    /** Times each pipeline got ran */
    pipelineRuns: Record<string, number>;
    /** Number of bytes reduced via compression modules */
    bytesShaved: number;
    /** Amount of time spent running tasks */
    msRan: number;
    /** Number of words read from parser */
    wordsParsed: number;
};

export type PipelineStatsPayload = {
    pipelineId: string;
    pipelineName: string;
    timesRan: number;
    timeTaken: number;
    bytesCompressed: number;
    wordsParsed: number;
    filesProcessed: number;
};

export type TaskQueue = Array<SpawnedTask>;

export type SpawnedTask = {
    id: number;
    /** Numerical id to sort */
    pipelineId: string;
    name: string;
    /** Percentage out of 100 */
    progress: number;
    subName?: string;
    subProgress?: number;
};

/** Data package sent to main thread to request a run */
export type ProcessingRequest = {
    pipeline: Pipeline;
    filePaths: string[];
};

/** Data packages sent to main to test a module */
export type RunTestRequest = FilterTestRequest | RenameTestRequest;

export type FilterTestRequest =
    | {
          type: ProcessingModuleType.filter;
          filter: string;
          invert: boolean;
          filePaths: string[];
          moduleType?: ProcessingModuleType;
      }
    | {
          type: ProcessingModuleType.ruleFilter;
          rules: Rule;
          invert: boolean;
          filePaths: string[];
          moduleType?: ProcessingModuleType;
      };

export type RenameTestRequest = {
    type: ProcessingModuleType.dynamicRename;
    templateString: string;
    filePaths: string[];
};
