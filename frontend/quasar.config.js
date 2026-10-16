// Configuração do Quasar (seção 9 da documentação técnica do M1).
import { defineConfig } from '#q-app/wrappers'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(() => ({
  boot: ['fontes'],
  css: ['app.scss'],
  extras: ['material-symbols-rounded'],

  build: {
    target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari15'], node: 'node22' },
    vueRouterMode: 'history',
    env: { APP_VERSION: version },
  },

  devServer: {
    open: false,
    // Em desenvolvimento local, a API roda com `uvicorn` na porta 8000
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },

  framework: {
    lang: 'pt-BR',
    iconSet: 'material-symbols-rounded',
    config: {
      dark: 'auto',
      // avisos no topo: embaixo eles cobriam a barra de navegação e o botão Continuar no celular
      notify: { position: 'top' },
      brand: {
        primary: '#A85A2A',
        secondary: '#2F5D50',
        accent: '#C98E5A',
        positive: '#2E7D32',
        negative: '#C62828',
        warning: '#B26A00',
        info: '#1565C0',
      },
    },
    plugins: ['Dark', 'LocalStorage', 'Notify'],
  },

  pwa: {
    workboxMode: 'GenerateSW',
    injectPwaMetaTags: true,
    extendGenerateSWOptions(cfg) {
      // A API nunca passa pelo cache do service worker
      cfg.navigateFallbackDenylist = [/^\/api\//]
      cfg.runtimeCaching = [{ urlPattern: /\/api\//, handler: 'NetworkOnly' }]
    },
  },
}))
