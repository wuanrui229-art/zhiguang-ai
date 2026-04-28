import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next'
import router from './router'
import App from './App.vue'

// TDesign 样式（必须在全局样式之前引入，方便覆盖）
import 'tdesign-vue-next/es/style/index.css'

// 全局自定义样式（在 TDesign 之后引入以便覆盖）
import './styles/global.css'

const app = createApp(App)

// 注册 Pinia 状态管理
app.use(createPinia())

// 注册 Vue Router
app.use(router)

// 全局注册 TDesign 组件库
app.use(TDesign)

app.mount('#app')