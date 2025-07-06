<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import StatsDisplay from 'src/components/Internals/Subsections/StatsDisplay.vue';
import { PipelineStatsPayload } from '@shared/common.types';
import { models } from 'src/data/models';

const stats = ref<PipelineStatsPayload[] | null>(null);

const getStats = () => {
  const data = models.stats.selectAll();
  stats.value = data;
}

onMounted(() => {
  getStats();
});
</script>

<template>
  <StatsDisplay v-if="stats" :stats="stats" />
</template>