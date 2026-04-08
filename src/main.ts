import { createApp } from 'vue'
import 'element-plus/dist/index.css'

import './scss/reset.css'


import App from './App.vue'
import router from './router/index'
import 'virtual:svg-icons-register'
import SvgIcon from './components/svgIcon.vue'
import VueKonva from 'vue-konva'
import { i18n } from './i18n'


import { createPinia } from 'pinia'

const app = createApp(App);
app.component('SvgIcon', SvgIcon)
app.use(createPinia())
app.use(router)
app.use(VueKonva)
app.use(i18n)

app.mount('#app')