<script setup lang="ts">
import { SpawnedTask } from '@utils/types';
import { computed } from 'vue';

interface Props {
  task: SpawnedTask & { pipelineName: string; }
}

const props = defineProps<Props>();

const letter = computed<string>(() => props.task.pipelineName[0] ?? '?')
</script>

<template>
  <q-item class="container">
    <q-item-section :class="{ done: task.progress === 100 }" avatar>
      <div class="spinners-container">
        <q-circular-progress show-value :value="task.progress" size="24px" :thickness="0.5" track-color="grey-8">
          <span>{{ letter }}</span>
        </q-circular-progress>
        <q-circular-progress v-if="!!task.subProgress" :value="task.subProgress ?? 0" size="12px" :thickness="0.8"
          track-color="grey-8" class="mini-spinner" />
      </div>
    </q-item-section>
    <q-item-section class="task-info">
      <div class="pipeline-name"> {{ task.pipelineName }}</div>
      <div class="file-name">{{ task.name }}</div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.task-info {
  display: flex;
  flex-direction: column;
  width: 80%;
}

.spinners-container {
  width: min-content;
  position: relative;
}

.mini-spinner {
  position: absolute;
  bottom: 0;
  right: 0;
}

.done {
  filter: saturate(0.5);
  opacity: 0.7;
}

.pipeline-name {
  max-width: 100%;
  font-size: smaller;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-name {
  max-width: 100%;
  font-size: x-small;
  opacity: 0.7;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>