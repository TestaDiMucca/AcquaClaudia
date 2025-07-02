<script setup lang="ts">
import { ProcessingModule } from '@shared/common.types';
import { isBranchingModule } from '@shared/common.utils';
import RuleViewer from 'src/components/common/RuleViewer.vue';
import { computed } from 'vue';

const props = defineProps<{
  processingModule: ProcessingModule,
}>();

const moduleOptions = computed(() => {
  if (isBranchingModule(props.processingModule)) {
    return null;
  }

  const options = props.processingModule.options || {};
  return Object.entries(options).reduce<{ key: string, value: string }[]>((acc, [key, value]) => {
    if (value !== undefined && typeof value !== 'object' && value !== '') {
      acc.push({ key, value: String(value) });
    }
    return acc;
  }, []);
});

const moduleBranchingRules = computed(() => {
  if (!isBranchingModule(props.processingModule)) {
    return null;
  }

  return props.processingModule.branches || [];
});
</script>

<template>
  <q-card>
    <q-card-section>
      <b>Module Options</b>
      <p>{{ processingModule.type }}</p>

      <section v-if="moduleOptions">
        <div v-for="{ value, key } in moduleOptions" :key="key">
          <b v-if="value !== undefined && key">{{ key }}:</b> {{ value }}
        </div>
      </section>

      <section v-if="moduleBranchingRules">
        <div v-for="(branch, index) in moduleBranchingRules" :key="index">
          <b>{{ branch.label ?? `Branch ${index + 1}` }}:</b>
          <RuleViewer :rule="branch.rules" />
        </div>
      </section>
    </q-card-section>
  </q-card>
</template>

<style scoped></style>