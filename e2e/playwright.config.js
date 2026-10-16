// Testes de ponta a ponta (CT11). O endereço vem de E2E_BASE_URL: o preview da Vercel na pipeline,
// ou o app local (`quasar dev`) na máquina.
import { defineConfig } from '@playwright/test'

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9000',
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } : {},
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    { name: 'celular', use: { browserName: 'chromium', viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
  ],
})
