<script setup lang="ts">
import PageLayout from 'src/layout/PageLayout.vue';
import ImportSection from './ImportSection.vue';
import { CardStyles } from '../Pipelines/pipelineGallery.helpers';
import store from '@utils/store';
import InternalsCards from './InternalsCards.vue';
import { watch } from 'vue';
import { useQuasar } from 'quasar'
import StatsWrapper from './Subsections/StatsWrapper.vue';

const handleChangeCardStyle = store.setAppSetting.bind(null, 'cardStyle');
const $q = useQuasar();

watch(() => store.state.settings.darkMode, () => {
  $q.dark.set(store.state.settings.darkMode);
})
</script>

<template>
  <PageLayout>
    <template #top-bar>
      <span>Tools & Internals</span>
      <span></span>
    </template>
    <template #content>
      <section class="sections-container">
        <InternalsCards>
          <template #headers>
            Settings
          </template>
          <template #content>
            <q-select class="dropdown" :model-value="store.state.settings.cardStyle"
              :options="Object.values(CardStyles)" @update:model-value="handleChangeCardStyle" label="Card style"
              :hide-dropdown-icon="true" />

            <q-toggle :model-value="store.state.settings.darkMode" @update:model-value="store.toggleDarkMode"
              label="Dark mode" />
          </template>
        </InternalsCards>
        <InternalsCards>
          <template #headers>
            Stats
          </template>
          <template #content>
            <StatsWrapper />
          </template>
        </InternalsCards>
        <InternalsCards>
          <template #headers>
            Import / Export
          </template>
          <template #content>
            <ImportSection />
          </template>
        </InternalsCards>
        <InternalsCards>
          <template #headers>
            Logs
          </template>
          <template #content>
            <div class="log-display">
              <li v-for="log of store.state.logs">
                {{ log }}
              </li>
            </div>
          </template>
        </InternalsCards>
      </section>
    </template>
  </PageLayout>
</template>

<style scoped>
.sections-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-gap);
}

.log-display {
  max-height: 200px;
}
</style>
