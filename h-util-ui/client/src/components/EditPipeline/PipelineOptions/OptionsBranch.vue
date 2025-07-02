<script setup lang="ts">
import { ProcessingBranch, ProcessingModule } from '@shared/common.types';
import { Rule } from '@shared/rules.types';
import { useToggle } from '@utils/composables/useToggle';
import RuleEditor from 'src/components/common/RuleEditor.vue';
import RuleViewer from 'src/components/common/RuleViewer.vue';
import { computed, inject, Ref, ref } from 'vue';

type Props = {
  moduleId: string;
  branch: ProcessingBranch;
  index: number;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update', data: Partial<ProcessingBranch> | null): void;
}>();

const pipelineModules = inject<Ref<ProcessingModule[]>>('pipelineModules');

const handleLabelChange = (label: string | number | null) => {
  emit('update', { label: label ? String(label) : undefined })
}

const handleRuleUpdates = (rules: Rule) => {
  emit('update', { rules });
}

const handleModuleUpdate = (opt) => {
  emit('update', { targetModule: opt.value })
}

// todo: "new module", and "none", and optimize
const moduleOptions = computed(() => (pipelineModules?.value ?? []).filter(m => m.id !== props.moduleId).map(m => ({
  label: m.type,
  value: m.id
})))

const currentSelectedModule = computed(() => moduleOptions.value.find(o => o.value === props.branch.targetModule))

const [expanded, toggleExpanded] = useToggle(true);
</script>

<template>
  <section class="branch-container card-border">
    <div class="main-options">
      <q-input class="option" type="text" :model-value="branch.label" @update:modelValue="handleLabelChange"
        label="Branch label" :placeholder="`Branch ${index}`" />
      <q-select v-if="moduleOptions.length > 0" class="option" :model-value="currentSelectedModule"
        :options="moduleOptions" @update:model-value="handleModuleUpdate" :hide-dropdown-icon="true"
        label="To existing module" />
      <div v-if="!moduleOptions.length" class="no-branch-targets">
        <span>No target modules</span>
      </div>
    </div>
    <div class="rule-option">
      <q-btn class="expansion-btn" @click="toggleExpanded">{{ expanded ? 'Collapse rules' : 'Expand rules' }}</q-btn>
      <RuleEditor v-if="expanded" :rule="branch.rules" @update-rule="handleRuleUpdates" />
      <RuleViewer v-else :rule="branch.rules" />
    </div>
  </section>
</template>

<style scoped>
.main-options {
  display: flex;
  gap: var(--spacer-gap);
  min-width: 400px;
  ;
}

.main-options .option {
  width: 50%;
}

.branch-container {
  padding: 0.5em;
}

.no-branch-targets {
  color: var(--text-color-secondary);
  font-style: italic;
  display: flex;
  align-items: center;
  padding-left: 1em;
}

.expansion-btn {
  margin-left: 1em;
  margin-top: 5px;
  ;
}
</style>
