<script setup lang="ts">
import { ref } from 'vue';
import { Aqueduct } from '@shared/common.types';
import Delete from 'vue-material-design-icons/Delete.vue'
import PageLayout from 'src/layout/PageLayout.vue';

import { removeVueRefs } from '@utils/helpers';
import PipelineSelector from '../common/PipelineSelector.vue';
import DirectoryPicker from '../common/DirectoryPicker.vue';
import { models } from 'src/data/models';

type Props = {
  aqueduct: Aqueduct;
  returnHome: () => void;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update'): void;
}>();
const localAqueduct = ref(props.aqueduct);

const addDirectory = () => {
  localAqueduct.value.directories.push('');
}

const removeDirectory = (index: number) => {
  localAqueduct.value.directories.splice(index, 1);
}

const handleSave = async () => {
  models.aqueducts.upsert(removeVueRefs(localAqueduct.value));

  props.returnHome();
  emit('update');
}

const onPipelineSelected = (id: string) => {
  localAqueduct.value.pipelineId = id;
}

const onDirSelected = (folder: string, index?: number) => {
  if (index !== undefined) {
    localAqueduct.value.directories[index] = folder;
  }
}
</script>

<template>
  <PageLayout>
    <template #top-bar>
      <span>
        New aqueduct
      </span>
      <span />
    </template>
    <template #content>
      <q-input type="text" v-model="localAqueduct.name" label="Name" />
      <q-input type="textarea" v-model="localAqueduct.description" label="Description" />

      <PipelineSelector :value="localAqueduct.pipelineId" @select="onPipelineSelected" />

      <div class="directories card-border">
        <div v-for="(_, index) in localAqueduct.directories" :key="index" class="directory-row">
          <DirectoryPicker @select="onDirSelected" :index="index" :value="localAqueduct.directories[index]" />

          <Delete v-if="localAqueduct.directories.length > 1" @click="removeDirectory(index)"
            class="remove-btn icon-button" :size="18" />
        </div>
        <button v-if="localAqueduct.directories.every(dir => dir !== '')" @click="addDirectory">Add directory</button>
      </div>
    </template>
    <template #footer>
      <button @click="returnHome">
        Cancel
      </button>
      <button @click="handleSave">
        Save aqueduct
      </button>
    </template>
  </PageLayout>
</template>

<style scoped>
.directories {
  padding: 10px;
  margin-top: 1em;
}

.directory-row {
  display: flex;
  gap: var(--spacer-gap);
  justify-content: center;
}
</style>
