<script setup lang="ts">
import { computed } from 'vue';
import { PipelineStatsPayload } from '@shared/common.types';
import { formatBytes, formatMilliseconds } from '@utils/helpers';

const { stats } = defineProps<{ stats: PipelineStatsPayload[] }>()

const pipelineRunData = computed(() => stats
  .sort((valueA, valueB) => valueB.timesRan - valueA.timesRan))

// todo: loop only once
const totalSpaceSaved = computed(() => stats.reduce((a, v) => a + v.bytesCompressed, 0))
const totalTime = computed(() => stats.reduce((a, v) => a + v.timeTaken, 0))
const totalFiles = computed(() => stats.reduce((a, v) => a + v.filesProcessed, 0))
</script>

<template>
  <b>Pipeline invocations</b>
  <div class="pipeline-stats">
    <div v-for="pipeline in pipelineRunData">
      {{ pipeline.pipelineName }} : {{ pipeline.timesRan }}
    </div>
  </div>
  <b>Other</b>
  <div>
    Time spent processing: {{ formatMilliseconds(totalTime) }}
  </div>
  <div>
    Space saved: {{ formatBytes(totalSpaceSaved) }}
  </div>
  <div>
    Files scanned: {{ totalFiles }}
  </div>
</template>