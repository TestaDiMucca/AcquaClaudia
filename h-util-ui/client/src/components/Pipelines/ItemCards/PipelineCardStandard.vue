<script setup lang="ts">
import { MODULE_MATERIAL_ICONS } from '@utils/constants';
import { computed, CSSProperties, ref } from 'vue';
import UnknownModule from 'vue-material-design-icons/FileQuestion.vue';
import PipelineCardDropdown from './PipelineCardDropdown.vue';
import PipelineCardDropzone from './PipelineCardDropzone.vue';
import { PipelineCardProps } from './itemCards.common';

const props = defineProps<PipelineCardProps>();

/** For custom color rendering */
const cardStyle = computed(() => props.pipelineItem.color ? {
  boxShadow: `inset 0 0 10px 5px ${props.pipelineItem.color}`, /* Blur effect with a shadow */
  boxSizing: 'border-box'
} satisfies CSSProperties : undefined)

const hasUnknownModule = computed(() => {
  return props.pipelineItem.processingModules.some(module => !MODULE_MATERIAL_ICONS[module.type]);
});

const isDragActive = ref(false);
const onDragActiveChange = (active: boolean) => {
  isDragActive.value = active;
}
</script>

<template>
  <q-card :class="{ 'pipeline-drop': isDragActive, 'pipeline-card': true, }">
    <PipelineCardDropzone :disabled="hasUnknownModule" :onDrop="onDrop" :onDragActiveChange="onDragActiveChange"
      :style="cardStyle" :class="{ disabled: hasUnknownModule }">
      <div class="pipeline-name">
        {{ pipelineItem.name }}
      </div>
      <p v-if="isDragActive">Drop files here ...</p>
      <p v-if="hasUnknownModule" class="text-negative">
        Unknown modules in pipeline!
      </p>
      <p v-else>Drop files here, or
        <span class="pipeline-drop-click-text">click to browse</span>
      </p>
      <nav class="icon-bar">
        <div class="module-icon-container" v-for="pipelineModule in pipelineItem.processingModules">
          <component :is="MODULE_MATERIAL_ICONS[pipelineModule.type] ?? UnknownModule"
            :class="{ 'unknown-module': hasUnknownModule }" />
          <q-tooltip :delay="500" :offset="[0, 10]">{{ pipelineModule.type }}</q-tooltip>
        </div>
      </nav>
    </PipelineCardDropzone>

    <PipelineCardDropdown class="sub-menu" :pipelineItem="pipelineItem" />
  </q-card>
</template>

<style scoped>
.pipeline-name {
  padding: 1em 2em;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.pipeline-drop {
  color: var(--q-lightColor);
  transform: scale(1.05);
  transform-origin: center;
}

.pipeline-drop-click-text {
  transition: color 0.5s;
}

.pipeline-card:hover .pipeline-drop-click-text {
  color: var(--q-lightColor);
}

.pipeline-card {
  box-sizing: border-box;
  transition: transform 0.5s;
  position: relative;
  min-width: var(--card-size-normal);
}

.pipeline-card.disabled {
  pointer-events: none;
}

.unknown-module {
  opacity: 0.5;
}

.icon-bar {
  font-size: smaller;
  display: flex;
  position: relative;
  width: 100%;
  justify-content: center;
  gap: var(--spacer-gap);
  padding: 0.5em;
}

.sub-menu {
  position: absolute;
  top: 8px;
  right: 0;
  z-index: 1;
}
</style>