<script setup lang="ts">
import { computed, ref, onBeforeMount, provide } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import Palette from 'vue-material-design-icons/Palette.vue'
import cloneDeep from 'lodash/cloneDeep';
import { NodeProps, VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background'

import { PageViews, ProcessingModule, ProcessingModuleType } from '@utils/types';
import store from '@utils/store';
import { DEFAULT_RANKING } from '@utils/constants';
import { navigateTo } from '@utils/helpers';
import PageLayout from 'src/layout/PageLayout.vue';
import { buildPipelineTopology, ChartNodeData } from './pipelineTopology';
import EditPipelineTopologyModule from './Topology/EditPipelineTopologyModule.vue';
import EditPipelineNewModule from './Topology/EditPipelineNewModule.vue';
import { getDefaultModule } from '@utils/models.helpers';
import { models } from 'src/data/models';
import { ProcessingSortOption } from '@shared/common.types';
import EditPipelineSortOption from './PipelineOptions/EditPipelineSortOption.vue';

const pipelineModules = ref<ProcessingModule[]>([
  getDefaultModule(uuidv4())
]);

const pipelineName = ref(`Nova fistula ${new Date().toISOString()}`);
const pipelineColor = ref<string>();
const pipelineRanking = ref(DEFAULT_RANKING);
const pipelineId = ref<string>();
const pipelineSort = ref<ProcessingSortOption>(ProcessingSortOption.none);

onBeforeMount(() => {
  const selected = store.state.selectedPipeline;

  if (!selected) return;
  pipelineModules.value = cloneDeep(selected.processingModules);
  pipelineName.value = selected.name;
  pipelineColor.value = selected.color;
  pipelineRanking.value = selected.manualRanking ?? DEFAULT_RANKING;
  pipelineId.value = selected.id;
  pipelineSort.value = selected.sortOption ?? ProcessingSortOption.none;
})

provide('pipelineModules', pipelineModules);

const handleModuleUpdated = (newData: ProcessingModule | null, index: number) => {
  const targetedModule = pipelineModules.value[index];

  if (!targetedModule) return;

  /** Null data means to remove the module */
  if (!newData) {
    pipelineModules.value.splice(index, 1);
    return;
  }
  pipelineModules.value[index] = newData;
}

const handleModuleUpdatedById = (newData: ProcessingModule | null, id: string) => {
  const targetedModuleIndex = getModuleIndexById(id);
  handleModuleUpdated(newData, targetedModuleIndex);
}

const getModuleIndexById = (id: string) => pipelineModules.value.findIndex(m => m.id === id);

const handleNewModules = (fromModuleId?: string, branchIndex?: number) => {
  const newModuleId = uuidv4();

  if (fromModuleId) {
    const sourceModule = getModuleIndexById(fromModuleId);

    if (pipelineModules.value[sourceModule]?.type !== ProcessingModuleType.branch) pipelineModules.value[sourceModule].nextModule = newModuleId
    else if (pipelineModules.value[sourceModule]?.type === ProcessingModuleType.branch && typeof branchIndex === 'number') {
      pipelineModules.value[sourceModule].branches[branchIndex].targetModule = newModuleId;
    }
  }
  pipelineModules.value.push(getDefaultModule(newModuleId))
}

const handleSavePipeline = () => {
  models.pipeline.upsert({
    id: store.state.selectedPipeline?.id ?? uuidv4(),
    name: pipelineName.value,
    manualRanking: pipelineRanking.value,
    color: pipelineColor.value,
    processingModules: pipelineModules.value,
    sortOption: pipelineSort.value,
  })

  store.syncPipelineDataFromStorage();
  returnHome();
};

const returnHome = () => {
  store.setSelectedPipeline(null);
  navigateTo(PageViews.Home);
}

const handlePipelineNameUpdated = (event: Event) => {
  const newValue = (event.target as HTMLInputElement).value;

  pipelineName.value = newValue;
}

const handlePipelineRankingUpdated = (event: Event) => {
  const newValue = (event.target as HTMLInputElement).value;

  pipelineRanking.value = +newValue;
}

const handlePipelineSortUpdated = (sortOption: ProcessingSortOption) => {
  pipelineSort.value = sortOption;
}

const hasNoModules = computed(() => pipelineModules.value.length === 0);
const header = computed(() => !!store.state.selectedPipeline ? 'Edit pipeline' : 'New pipeline');

const vueFlowTopology = computed(() => buildPipelineTopology(pipelineModules.value));
</script>

<template>
  <PageLayout>
    <template #top-bar>
      <span>{{ header }}</span>
    </template>
    <template #content>
      <section class="pipeline-opts">
        <q-input type="text" class="text-input input-field" label="Pipeline name" v-model="pipelineName"
          @input="handlePipelineNameUpdated" />
        <q-input type="number" class="number-input input-field" label="Pipeline rank" v-model="pipelineRanking"
          @input="handlePipelineRankingUpdated" />
        <EditPipelineSortOption class="dropdown" :value="pipelineSort" @select="handlePipelineSortUpdated" />
        <q-input v-model="pipelineColor" :rules="pipelineColor === '' ? [] : ['anyColor']" label="Display color"
          class="color-input" no-error-icon>
          <template v-slot:append>
            <button class="button-with-icon-child">
              <Palette class="icon-button cursor-pointer"
                :style="pipelineColor ? { color: pipelineColor } : undefined" />
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-color no-footer v-model="pipelineColor" />
              </q-popup-proxy>
            </button>
          </template>
          <template v-slot:error>
            Not a valid color
          </template>
        </q-input>
      </section>

      <section class="pipeline-topology">
        <VueFlow class="vue-flow" :nodes="vueFlowTopology.nodes" :edges="vueFlowTopology.links">
          <Background />

          <template #node-default="props: NodeProps<ChartNodeData>">
            <EditPipelineTopologyModule v-if="props.data.pipelineModule" :processing-module="props.data.pipelineModule"
              :handle-module-updated="handleModuleUpdatedById" />
          </template>

          <template #node-branch="props: NodeProps<ChartNodeData>">
            <EditPipelineTopologyModule v-if="props.data.pipelineModule" :processing-module="props.data.pipelineModule"
              :handle-module-updated="handleModuleUpdatedById" />
          </template>

          <template #node-new="props: NodeProps<ChartNodeData>">
            <EditPipelineNewModule
              :handle-new-modules="() => handleNewModules(props.data.fromModuleId, props.data.branchIndex)"
              :from-id="props.data.fromModuleId" />
          </template>
        </VueFlow>
      </section>
    </template>
    <template #footer>
      <button @click="returnHome">
        Cancel
      </button>
      <button :disabled="hasNoModules" @click="handleSavePipeline">
        Save pipeline
      </button>
    </template>
  </PageLayout>
</template>

<style scoped>
.pipeline-opts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-gap: 1em;
  width: 100%;
  padding: 0 10em;
}

.pipeline-opts .text {
  min-width: 150px;
}

.modules-container {
  min-width: 300px;
  width: 70%;
  margin: auto;
  position: relative;
}

.pipeline-topology {
  width: 70%;
  margin: auto;
  height: 400px;
  min-height: 400px;
}

.vue-flow {
  border: 1px solid gray;
}

.line {
  height: 20px;
  width: 2px;
  background: var(--q-lightColor);
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateY(50%);
}

.line-end {
  opacity: 0.4;
}

.new-module-card {
  padding: 1em;
  width: 100%;
  cursor: pointer;
  justify-content: center;
  display: flex;
  gap: var(--spacer-gap);
}

.color-input button {
  margin: 0;
  padding: 1em 0 0;
}
</style>
