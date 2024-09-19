import Folder from 'vue-material-design-icons/FolderUpload.vue';
import FileImageMinus from 'vue-material-design-icons/FileImageMinus.vue';
import VideoMinus from 'vue-material-design-icons/VideoMinus.vue';
import CalendarExport from 'vue-material-design-icons/CalendarExport.vue';
import DatabaseExport from 'vue-material-design-icons/DatabaseExport.vue';
import Printer from 'vue-material-design-icons/Printer.vue';
import Filter from 'vue-material-design-icons/Filter.vue';
import FilterMinus from 'vue-material-design-icons/FilterMinus.vue';
import TextSearch from 'vue-material-design-icons/TextSearch.vue';
import FileDocument from 'vue-material-design-icons/FileDocumentArrowRight.vue';
import Rename from 'vue-material-design-icons/RenameBoxOutline.vue';
import Branching from 'vue-material-design-icons/FamilyTree.vue';
import Pipe from 'vue-material-design-icons/Pipe.vue';

import { ActionModule, ProcessingModule, ProcessingModuleType } from './types';
import { VueComponent } from './util.types';
import OptionsStandard from 'src/components/EditPipeline/PipelineOptions/OptionsStandard.vue';
import OptionsDirectory from 'src/components/EditPipeline/PipelineOptions/OptionsDirectory.vue';
import OptionsFilter from 'src/components/EditPipeline/PipelineOptions/OptionsFilter.vue';
import OptionsDynamicRename from 'src/components/EditPipeline/PipelineOptions/OptionsDynamicRename.vue';
import OptionsRuleFilter from 'src/components/EditPipeline/PipelineOptions/OptionsRuleFilter.vue';
import OptionsPipelineSelect from 'src/components/EditPipeline/PipelineOptions/OptionsPipelineSelect.vue';

/** If an emoji representation of the modules are needed */
export const MODULE_ICONS: Record<ProcessingModuleType, string> = {
    [ProcessingModuleType.subfolder]: '📂',
    [ProcessingModuleType.compressImage]: '📷',
    [ProcessingModuleType.compressVideo]: '🎥',
    [ProcessingModuleType.datePrefix]: '🗓',
    [ProcessingModuleType.metadata]: '📝',
    [ProcessingModuleType.iterate]: '🖨',
    [ProcessingModuleType.filter]: '🗑',
    [ProcessingModuleType.ocr]: '📖',
    [ProcessingModuleType.report]: '📉',
    [ProcessingModuleType.dynamicRename]: '📇',
    [ProcessingModuleType.ruleFilter]: '📏',
    [ProcessingModuleType.branch]: '🌳',
    [ProcessingModuleType.runPipeline]: '🪈',
};

/** Icon representation of the module operations */
export const MODULE_MATERIAL_ICONS: Record<ProcessingModuleType, VueComponent> = {
    [ProcessingModuleType.subfolder]: Folder,
    [ProcessingModuleType.compressImage]: FileImageMinus,
    [ProcessingModuleType.compressVideo]: VideoMinus,
    [ProcessingModuleType.datePrefix]: CalendarExport,
    [ProcessingModuleType.metadata]: DatabaseExport,
    [ProcessingModuleType.iterate]: Printer,
    [ProcessingModuleType.filter]: FilterMinus,
    [ProcessingModuleType.ocr]: TextSearch,
    [ProcessingModuleType.report]: FileDocument,
    [ProcessingModuleType.dynamicRename]: Rename,
    [ProcessingModuleType.ruleFilter]: Filter,
    [ProcessingModuleType.branch]: Branching,
    [ProcessingModuleType.runPipeline]: Pipe,
};

/**
 * Providing no label means this module has no option
 */
export const OPTION_LABELS: Record<ProcessingModuleType, string | null> = {
    [ProcessingModuleType.subfolder]: 'Directory name',
    [ProcessingModuleType.compressImage]: 'Quality (0-100%)',
    /** Where 0 CRF is lossless and 23 is "standard" */
    [ProcessingModuleType.compressVideo]: 'Quality (0-51 CRF)',
    /** Temp: accept format strings in future. */
    [ProcessingModuleType.datePrefix]: null,
    [ProcessingModuleType.metadata]: null,
    [ProcessingModuleType.iterate]: 'Output file name',
    [ProcessingModuleType.filter]: 'Filename match',
    [ProcessingModuleType.ocr]: 'Search string (CSV supported)',
    [ProcessingModuleType.report]: 'Save directory',
    [ProcessingModuleType.dynamicRename]: 'Rename string template',
    [ProcessingModuleType.ruleFilter]: '-',
    [ProcessingModuleType.branch]: '-',
    [ProcessingModuleType.runPipeline]: 'Target pipeline',
};

export const OPTION_TOOLTIP: Partial<Record<ProcessingModuleType, string>> = {
    [ProcessingModuleType.compressVideo]: 'For quality, 0 CRF is lossless and 23 is "standard"',
    [ProcessingModuleType.iterate]: 'File will be outputted in the directory of the input files.',
    [ProcessingModuleType.ruleFilter]: 'Files passing the rule set will continue down the pipeline',
};

export const getOptionsComponent = (moduleType: ProcessingModuleType) => {
    switch (moduleType) {
        case ProcessingModuleType.datePrefix:
        case ProcessingModuleType.metadata:
            return null;
        case ProcessingModuleType.report:
            return OptionsDirectory;
        case ProcessingModuleType.filter:
            return OptionsFilter;
        case ProcessingModuleType.dynamicRename:
            return OptionsDynamicRename;
        case ProcessingModuleType.ruleFilter:
            return OptionsRuleFilter;
        case ProcessingModuleType.runPipeline:
            return OptionsPipelineSelect;
        default:
            return OptionsStandard;
    }
};

/** Get a default starter module */
export const getDefaultModule = (id: string, branching = false): ProcessingModule =>
    branching
        ? {
              id,
              type: ProcessingModuleType.branch,
              branches: [],
          }
        : {
              id,
              type: ProcessingModuleType.datePrefix,
              options: {
                  value: '',
                  inverse: false,
                  ignoreErrors: true,
                  skipPreviouslyFailed: false,
              },
          };

export const MAX_TASKS = 5;

export const DEFAULT_RANKING = 100;
