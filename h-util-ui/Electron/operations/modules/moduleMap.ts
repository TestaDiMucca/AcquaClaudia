import { ProcessingModuleType } from '@shared/common.types';
import { ModuleHandler } from '@util/types';

import datePrefixHandler from './datePrefix.handler';
import moveDirectoryHandler from './moveDirectory.handler';
import nameTagHandler from './nameTag.handler';
import iterateHandler from './iterate.handler';
import filterHandler from './filter.handler';
import jpgCompressHandler from './jpgCompress.handler';
import ocrHandler from './ocr.handler';
import movCompressHandler from './movCompress.handler';
import reportHandler from './report.handler';
import dynamicRenameHandler from './dynamicRename.handler';
import ruleFilterHandler from './ruleFilter.handler';
import runPipelineHandler from './runPipeline.handler';
import convertVideoHandler from './convertVideo.handler';
import fileSanitize from './fileSanitize.handler';
import imageToTextHandler from './imageToText.handler';

export const MODULE_MAP: Record<ProcessingModuleType, ModuleHandler | null> = {
    [ProcessingModuleType.datePrefix]: datePrefixHandler,
    [ProcessingModuleType.subfolder]: moveDirectoryHandler,
    [ProcessingModuleType.metadata]: nameTagHandler,
    [ProcessingModuleType.compressImage]: jpgCompressHandler,
    [ProcessingModuleType.compressVideo]: movCompressHandler,
    [ProcessingModuleType.iterate]: iterateHandler,
    [ProcessingModuleType.filter]: filterHandler,
    [ProcessingModuleType.ocr]: ocrHandler,
    [ProcessingModuleType.report]: reportHandler,
    [ProcessingModuleType.dynamicRename]: dynamicRenameHandler,
    [ProcessingModuleType.ruleFilter]: ruleFilterHandler,
    [ProcessingModuleType.branch]: null,
    [ProcessingModuleType.runPipeline]: runPipelineHandler,
    [ProcessingModuleType.videoConvert]: convertVideoHandler,
    [ProcessingModuleType.filenameSanitize]: fileSanitize,
    [ProcessingModuleType.imageToText]: imageToTextHandler,
};
