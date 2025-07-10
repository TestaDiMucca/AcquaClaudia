<script setup lang="ts">
import { IpcMessageType } from '@shared/common.constants';
import { Pipeline } from '@utils/types';
import { getIpcRenderer } from '@utils/helpers';
import PipelineCardStandard from './ItemCards/PipelineCardStandard.vue';
import { CardStyles } from './pipelineGallery.helpers';
import PipelineCardCompact from './ItemCards/PipelineCardCompact.vue';
import PipelineCardTopology from './ItemCards/PipelineCardTopology.vue';

interface Props {
  pipelineItem: Pipeline;
  cardStyle: CardStyles;
}

const props = defineProps<Props>()
const onDrop = (filePaths: string[]) => {
  if (!filePaths.length) return;

  const payload = {
    filePaths,
    pipeline: props.pipelineItem
  }

  /**
   * Not a network request so not dealing with compressing the payload or using an id only
   * There may be cost in serializing the pipeline but either seems trivial at this point but
   * may improve in the future
   */
  getIpcRenderer().send(IpcMessageType.runPipeline, [JSON.stringify(payload)])
}


</script>

<template>
  <PipelineCardCompact v-if="cardStyle === CardStyles.compact" :onDrop="onDrop" :pipelineItem="pipelineItem" />
  <PipelineCardTopology v-else-if="cardStyle === CardStyles.topologies" :onDrop="onDrop" :pipelineItem="pipelineItem" />
  <PipelineCardStandard v-else :onDrop="onDrop" :pipelineItem="pipelineItem" />
</template>
