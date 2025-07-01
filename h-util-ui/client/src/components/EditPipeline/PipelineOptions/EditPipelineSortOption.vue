<script setup lang="ts">
import { ProcessingSortOption } from '@shared/common.types';
import { computed } from 'vue';

type Props = {
  value: ProcessingSortOption;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', opt: ProcessingSortOption): void;
}>();

const sortOptions = computed(() => Object.entries(ProcessingSortOption).map(([key, value]) => ({
  label: key,
  value: value
})))

const selectedOption = computed(() => sortOptions.value.find(o => o.value === props.value));

const handleSelectOption = (opt) => {
  emit('select', opt.value);
}
</script>

<template>
  <q-select class="dropdown" :model-value="selectedOption" @update:model-value="handleSelectOption"
    :options="sortOptions" label="Sort option" :hide-dropdown-icon="true" />
</template>
