<script setup lang="ts">
import { ProcessingModuleType } from '@shared/common.types';
import DropdownMenu, { MenuItem } from '../common/DropdownMenu.vue';

interface Props {
  handleModuleTypeSelect: (moduleType: ProcessingModuleType) => void;
}

const props = defineProps<Props>();

const handleModuleTypeSelect = (type: ProcessingModuleType) => () => props.handleModuleTypeSelect(type);

const menuItems: MenuItem[] = [
  {
    type: 'item',
    label: 'Place in directory',
    onClick: handleModuleTypeSelect(ProcessingModuleType.subfolder)
  },
  {
    type: 'separator'
  },
  {
    type: 'item',
    label: 'Dynamic renaming',
    onClick: handleModuleTypeSelect(ProcessingModuleType.dynamicRename)
  },
  {
    type: 'item',
    label: 'Sanitize filename',
    onClick: handleModuleTypeSelect(ProcessingModuleType.filenameSanitize)
  },
  { type: 'separator' },
  {
    type: 'item',
    label: 'Log results',
    onClick: handleModuleTypeSelect(ProcessingModuleType.report)
  },

  {
    type: 'group',
    label: 'Flow control',
    items: [
      {
        type: 'item',
        label: 'Direct to pipeline',
        onClick: handleModuleTypeSelect(ProcessingModuleType.runPipeline)
      },
      { type: 'item', label: 'Branching', onClick: handleModuleTypeSelect(ProcessingModuleType.branch) }
    ]
  },
  {
    type: 'group',
    label: 'Media operations',
    items: [
      {
        type: 'item',
        label: 'Compress image',
        onClick: handleModuleTypeSelect(ProcessingModuleType.compressImage)
      },
      {
        type: 'item',
        label: 'Compress video',
        onClick: handleModuleTypeSelect(ProcessingModuleType.compressVideo)
      },
      {
        type: 'item',
        label: 'Metadata tag',
        onClick: handleModuleTypeSelect(ProcessingModuleType.metadata)
      },
    ]
  },
  {
    type: 'group',
    label: 'Filtering',
    items: [
      {
        type: 'item',
        label: 'Filter by Rules',
        onClick: handleModuleTypeSelect(ProcessingModuleType.ruleFilter)
      },
      {
        type: 'item',
        label: 'Search image for text',
        onClick: handleModuleTypeSelect(ProcessingModuleType.ocr)
      },
    ]
  },
  {
    type: 'group',
    label: 'Legacy',
    items: [
      {
        type: 'item',
        label: 'Filter file by name',
        onClick: handleModuleTypeSelect(ProcessingModuleType.filter)
      },
      {
        type: 'item',
        label: 'Date prefix',
        onClick: handleModuleTypeSelect(ProcessingModuleType.datePrefix)
      },
      {
        type: 'item',
        label: 'Iterate',
        onClick: handleModuleTypeSelect(ProcessingModuleType.iterate)
      },
    ]
  },
  {
    type: 'group',
    label: 'WIP',
    items: [
      {
        type: 'item',
        label: 'Convert to mp4',
        onClick: handleModuleTypeSelect(ProcessingModuleType.videoConvert)
      },
      {
        type: 'item',
        label: 'Image to text output',
        onClick: handleModuleTypeSelect(ProcessingModuleType.imageToText)
      },
    ]
  }
]
</script>

<template>
  <DropdownMenu :menuItems="menuItems" />
</template>