import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [vue({ template: { transformAssetUrls } }), quasar({ sassVariables: false })],
  resolve: {
    alias: {
      src,
      components: `${src}/components`,
      layouts: `${src}/layouts`,
      pages: `${src}/pages`,
    },
  },
  define: { 'process.env.APP_VERSION': JSON.stringify('0.1.0-teste') },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    css: false,
    // A primeira montagem compila o Quasar inteiro e passa dos 5 s padrão em máquinas mais lentas
    testTimeout: 20_000,
  },
})
