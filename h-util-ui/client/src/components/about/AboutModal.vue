<script setup lang="ts">
import { ref } from 'vue';

enum Tabs {
  usage = 'usage',
  about = 'about',
}

const tab = ref(Tabs.about);
const about = ref(false);

defineProps<{
  openButton: any;
  openButtonProps?: Record<string, any>;
}>();


</script>

<template>
  <component class="icon-button" @click="about = true" :is="openButton" v-bind="openButtonProps ?? {}" />

  <q-dialog v-model="about" backdrop-filter="blur(5px)">
    <q-card class="about-card">
      <q-card-section style="width: 70vw;">
        <div class="text-h6">About</div>
      </q-card-section>

      <q-tabs v-model="tab">
        <q-tab name="about" label="About" />
        <q-tab name="usage" label="Modules" />
      </q-tabs>

      <q-card-section v-if="tab === Tabs.about">
        <div class="text-subtitle1">H-Util Visual</div>
        <div class="text-caption">
          A visual interface for the Hoarder-Util CLI tool. It allows you to run pipelines, view stats, and manage your
          files.

          <br />
          <br />
          The original CLI tool is no longer maintained, but should operate as expected. This was meant as a
          personal-use utility, so in many places design and UX may not be optimal.
          <br />
          <br />

          Developed by <a href="https://github.com/TestaDiMucca">我係「牛頭」</a> 2024
        </div>
      </q-card-section>

      <q-card-section v-if="tab === Tabs.usage">
        Notes on some of the trickier modules and their usage:
        <ul>
          <li>Filter modules: filter files from rest of the pipeline</li>
          <li>Branch: construct rules to control the flow of files through the pipeline</li>
          <li>Metadata tagging: A static operation which parses a filename into video metadata</li>
          <li>Delete: Use with caution as any file not filtered out from the pipeline will be trashed</li>
        </ul>

      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup="true" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.about-card {
  overflow-x: hidden;
}
</style>
