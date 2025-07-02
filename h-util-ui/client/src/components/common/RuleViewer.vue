<script setup lang="ts">
import { ref } from 'vue';
import { Rule } from '@shared/rules.types';
import { isGroupedRule } from '@shared/rules.utils';

type Props = {
  rule: Rule;
  /** Should not pass in, just used recursively for styling/max purposes */
  nested?: number;
}

const props = defineProps<Props>();

const currentRule = ref(props.rule);
</script>

<template>
  <div :class="{ 'rule-editor': !nested, 'nested-rule': nested }">
    <span>
      <template v-if="isGroupedRule(currentRule)">
        <div class="single-rule" v-for="(subRule, index) in currentRule.rules" :key="index">
          <RuleViewer :rule="subRule" :nested="(nested || 0) + 1" />
          <span class="logical-operator" v-if="index < currentRule.rules.length - 1">{{ currentRule.type }}</span>
        </div>
      </template>
      <template v-else>
        {{ currentRule.attribute }} {{ currentRule.operator }} {{ currentRule.value }}
      </template>
    </span>
  </div>
</template>

<style scoped>
.rule-editor {
  margin: 10px;
  padding: 10px;
}

.logical-operator {
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>