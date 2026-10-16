import { mount, flushPromises } from '@vue/test-utils'
import { Quasar, Dark, LocalStorage, Notify } from 'quasar'
import { createRouter, createMemoryHistory } from 'vue-router'
import routes from 'src/router/routes'

export function largura(px) {
  window.innerWidth = px
  window.dispatchEvent(new Event('resize'))
}

export async function montarApp(caminho = '/') {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push(caminho)
  await router.isReady()
  const App = { template: '<router-view />' }
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [[Quasar, { plugins: { Dark, LocalStorage, Notify } }], router] },
  })
  await flushPromises()
  return { wrapper, router }
}

export function respostaJson(corpo, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } }),
  )
}
