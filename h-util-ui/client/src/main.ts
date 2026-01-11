import { createApp } from 'vue';
import { Quasar, type QuasarPluginOptions } from 'quasar';
import Notify from 'quasar/src/plugins/notify/Notify';

import './variables.css';
import './style.css';
import './global.css';
import App from './App.vue';

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

const myApp = createApp(App);

const quasarOptions = {
    plugins: {
        Notify,
    },
    config: {
        notify: {
            timeout: 1500,
        },
        brand: {
            primary: '#efc648',
            secondary: '#ffc14f',
            accent: '#db5240',

            dark: '#332c2c',
            'dark-page': '#171111',

            positive: '#34bf54',
            negative: '#ad0014',
            info: '#31CCEC',
            warning: '#F2C037',
        },
    },
} as unknown as Partial<QuasarPluginOptions>;

myApp.use(Quasar, quasarOptions);

myApp.mount('#app');
