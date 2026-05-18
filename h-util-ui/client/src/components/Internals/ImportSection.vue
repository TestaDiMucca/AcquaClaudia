<script setup lang="ts">
import { getIpcRenderer } from '@utils/helpers';
import { ref } from 'vue';
import ImportExportDisplay from './ImportExportDisplay.vue';
import PipelineImport from './PipelineImport.vue';
import { models } from 'src/data/models';

enum View {
  default = 'default',
  import = 'import'
}

const tab = ref(View.default);

const handleExportPipelines = () => {
  const data = models.pipeline.selectAll();

  if (!data?.pipelines) return;

  getIpcRenderer().saveFile(JSON.stringify(data.pipelines));
}

const handleImportPipelines = () => tab.value = View.import;
</script>

<template>
  <ImportExportDisplay v-if="tab === View.default" :handle-export-pipelines="handleExportPipelines"
    :handle-import-pipelines="handleImportPipelines" />
  <PipelineImport v-if="tab === View.import" />
</template>
