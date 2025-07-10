import { reactive } from 'vue';

import { Pipeline, TaskQueue } from './types';
import { AppFunctionalSettings, Aqueduct } from '@shared/common.types';
import { CardStyles } from 'src/components/Pipelines/pipelineGallery.helpers';
import { models } from 'src/data/models';

export type AppSettings = {
    cardStyle: CardStyles;
    darkMode: boolean;
} & AppFunctionalSettings;

export type VueStore = {
    pipelines: Record<string, Pipeline>;
    aqueducts: Aqueduct[] | null;
    selectedPipeline: Pipeline | null;
    taskQueue: TaskQueue;
    settings: AppSettings;
    logs: string[];
};

/** See composition API for more info */
const state = reactive<VueStore>({
    pipelines: {},
    aqueducts: null,
    selectedPipeline: null,
    taskQueue: [],
    settings: {
        cardStyle: CardStyles.standard,
        darkMode: true,
    },
    logs: [],
});

const syncPipelineDataFromStorage = () => {
    const all = models.pipeline.selectAll();

    state.pipelines = all;
};

const setAllPipelines = (data: VueStore['pipelines']) => {
    state.pipelines = { ...data };
};

const setSelectedPipeline = (pipeline: Pipeline | null) => {
    state.selectedPipeline = pipeline;
};

const setAqueducts = (aqueducts: Aqueduct[]) => {
    state.aqueducts = aqueducts;
};

const setAppSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    state.settings[key] = value;
};

const toggleDarkMode = () => {
    state.settings.darkMode = !state.settings.darkMode;
};

const addLog = (message: string) => {
    state.logs.unshift(message);
};

export default {
    state,
    addLog,
    syncPipelineDataFromStorage,
    toggleDarkMode,
    setAppSetting,
    setAqueducts,
    setAllPipelines,
    setSelectedPipeline,
};
