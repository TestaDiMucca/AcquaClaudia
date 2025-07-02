<script setup lang="ts">
import { sendMessageToMain } from '@utils/helpers';
import { FileUploadOptions, useDropzone } from "vue3-dropzone";
import { ElectronFile } from './itemCards.common';
import { watch } from 'vue';

interface Props {
  onDrop: (fileList: string[]) => void;
  onDragActiveChange?: (active: boolean) => void;
  disabled?: boolean;
};
const props = defineProps<Props>();

const onDrop: FileUploadOptions['onDrop'] = (acceptFiles: ElectronFile[], _rejectReason) => {
  if (acceptFiles.length) {
    props.onDrop(acceptFiles.map(f => f.path));
  } else {
    sendMessageToMain('No files detected');
  }
}

const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: props.disabled });

watch(isDragActive, () => {
  props.onDragActiveChange?.(isDragActive.value);
})
</script>

<template>
  <div v-bind="getRootProps()" class="cursor-pointer">
    <input v-bind="getInputProps()" />
    <slot></slot>
  </div>
</template>