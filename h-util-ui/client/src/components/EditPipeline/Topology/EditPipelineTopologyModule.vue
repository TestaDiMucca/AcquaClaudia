<script setup lang="ts">
import { ProcessingModule, ProcessingModuleType } from '@shared/common.types';
import { computed, ref } from 'vue';
import EditPipelineModule from '../EditPipelineModule.vue';
import { MODULE_MATERIAL_ICONS } from '@utils/constants';
import EditPipelineTopologyModuleTooltip from './EditPipelineTopologyModuleTooltip.vue';

const props = defineProps<{
  processingModule: ProcessingModule;
  handleModuleUpdated: (newData: ProcessingModule | null, id: string) => void;
}>();

const editor = ref(false);
const iconSignifier = computed(() => MODULE_MATERIAL_ICONS[props.processingModule.type])

const closeEditor = () => {
  editor.value = false;
}
</script>

<template>
  <div class="module-node">
    <span>
      <component :is="iconSignifier" />
      <q-tooltip anchor="center right">
        <EditPipelineTopologyModuleTooltip :processing-module="processingModule" />
      </q-tooltip>
      <span class="title">{{ processingModule.type }}</span>
    </span>

    <div @click="editor = true" class="cursor-pointer">
      Edit
    </div>
  </div>

  <q-dialog v-model="editor" backdrop-filter="blur(5px)">
    <EditPipelineModule :processing-module="processingModule" :handle-module-updated="handleModuleUpdated"
      :onClose="closeEditor" />
  </q-dialog>
</template>

<style scoped>
.module-node .title {
  font-weight: 700;
}
</style>