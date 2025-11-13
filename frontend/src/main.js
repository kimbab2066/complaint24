import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
// Daum API 플러그인
import VueDaumPostcode from 'vue-daum-postcode';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { createPinia } from 'pinia';
import piniaPluginPersistedState from 'pinia-plugin-persistedstate';

import '@/assets/tailwind.css';
import '@/assets/styles.scss';

const app = createApp(App);
const pinia = createPinia();

// Daum API 플러그인 등록
app.use(VueDaumPostcode);

pinia.use(piniaPluginPersistedState);

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
