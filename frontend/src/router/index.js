import { defineRouter } from '#q-app/wrappers'
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import routes from './routes'

export default defineRouter(() =>
  createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: process.env.SERVER ? createMemoryHistory() : createWebHistory(process.env.VUE_ROUTER_BASE),
  }),
)
