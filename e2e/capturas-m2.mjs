// Capturas do guia de uso do M2 (docs/uso/img/m2): percorre o cadastro guiado inteiro com dados fictícios,
// no celular e no desktop, e fotografa cada tela. Uso: node capturas-m2.mjs (app local em E2E_BASE_URL,
// padrão http://localhost:9001, com a API ligada).
import { chromium } from '@playwright/test'
const D = '../docs/uso/img/m2/'
const SENHA = 'senha-de-teste-e2e'
const b = await chromium.launch()
const telas = {
  desktop: { viewport: { width: 1440, height: 900 } },
  celular: { viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}
const pausa = (p, ms = 700) => p.waitForTimeout(ms)
for (const [t, o] of Object.entries(telas)) {
  const ctx = await b.newContext({
    ...o,
    locale: 'pt-BR',
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9001',
  })
  const p = await ctx.newPage()
  const foto = async (nome, full = false, avisos = false) => {
    if (!avisos)
      await p
        .locator('.q-notification')
        .first()
        .waitFor({ state: 'detached', timeout: 9000 })
        .catch(() => {})
    await p
      .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
      .catch(() => {})
    await p.screenshot({ path: `${D}${nome}-${t}.png`, fullPage: full })
  }
  const continuar = async () => {
    await p.getByRole('button', { name: /^(Continuar|Concluir|Salvar)$/ }).click()
    await pausa(p, 900)
  }

  await p.goto('/entrar')
  await p.locator('h1').waitFor()
  await pausa(p)
  await foto('entrar')
  await p.goto('/criar-conta')
  await p.locator('h1').waitFor()
  await p.getByLabel('Nome').fill('Ana Souza')
  await p.getByLabel('E-mail').fill(`ana.${t}${Date.now()}@exemplo.com`)
  await p.getByLabel('Senha').fill(SENHA)
  await p.getByRole('checkbox').click()
  await pausa(p, 300)
  await foto('criar-conta')
  await p.getByRole('button', { name: 'Criar conta' }).click()
  await p.getByLabel('Como posso te chamar?').waitFor()
  await pausa(p)

  // 1
  await p.getByLabel('Como posso te chamar?').fill('Ana')
  await p.getByRole('radio', { name: 'Quitar dívida' }).click()
  await pausa(p, 300)
  await foto('etapa1-boas-vindas')
  await continuar()
  await foto('conquista', false, true)
  // 2
  await p.getByLabel('Dia do salário').fill('15')
  await p.getByLabel('Valor médio').fill('5200')
  await p.getByRole('radio', { name: 'Antecipa' }).click()
  await pausa(p, 300)
  await foto('etapa2-renda', t === 'desktop')
  await continuar()
  // 3
  for (const [nome, banco, tipo, saldo] of [
    ['Conta Nubank', 'Nubank', 'Corrente', '850'],
    ['Conta Familiar', 'Inter', 'Familiar', '0'],
  ]) {
    await p.getByLabel('Nome da conta').fill(nome)
    await p.getByRole('radio', { name: banco }).click()
    await p.getByRole('radio', { name: tipo }).click()
    const s = p.getByLabel(/Saldo/)
    if (await s.count()) await s.first().fill(saldo)
    await p.getByRole('button', { name: 'Adicionar conta' }).click()
    await pausa(p, 300)
  }
  await foto('etapa3-contas', t === 'desktop')
  await continuar()
  // 4
  await p.getByLabel('Cartão').fill('Nubank')
  await p.getByLabel('Limite').fill('4000')
  await p.getByLabel('Fecha dia').fill('17')
  await p.getByLabel('Vence dia').fill('24')
  await p.getByRole('button', { name: 'Adicionar cartão' }).click()
  await pausa(p, 400)
  await foto('etapa4-cartoes', t === 'desktop')
  await continuar()
  // 5
  await p.locator('.q-chip').filter({ hasText: 'Aluguel' }).click()
  await p.getByLabel('Valor', { exact: true }).fill('2000')
  await pausa(p, 300)
  await p
    .locator('.q-chip')
    .filter({ hasText: 'Internet' })
    .first()
    .click()
    .catch(() => {})
  const valores = p.getByLabel('Valor', { exact: true })
  if ((await valores.count()) > 1) await valores.nth(1).fill('120')
  await pausa(p, 300)
  await foto('etapa5-contas-fixas', t === 'desktop')
  await continuar()
  // 6
  await p.getByText('Divido contas com alguém').click()
  await p.getByLabel('Com quem').fill('Bruno')
  await p.getByRole('radio', { name: 'Conta Familiar' }).click()
  await p.getByText(/^Aluguel · sua parte/).click()
  await pausa(p, 300)
  await foto('etapa6-familia', t === 'desktop')
  await continuar()
  // 7
  await p.locator('.q-chip').filter({ hasText: 'Reserva de emergência' }).click()
  await p.getByLabel('Débito e Pix').fill('300')
  await pausa(p, 300)
  await foto('etapa7-objetivos', t === 'desktop')
  await continuar()
  await p.getByRole('heading', { name: 'Tudo pronto, Ana!' }).waitFor()
  await pausa(p, 1200)
  await foto('fechamento', t === 'desktop')
  await p.getByRole('link', { name: 'Ver meu período' }).click()
  await pausa(p, 1200)
  await foto('inicio')

  await p.goto('/configuracoes')
  await p.getByRole('heading', { name: 'Configurações' }).waitFor()
  await pausa(p)
  await foto('configuracoes-perfil', t === 'desktop')
  await p.goto('/configuracoes?aba=cadastro')
  await p.locator('.q-page .q-item').first().waitFor()
  await pausa(p)
  await foto('configuracoes-cadastro', t === 'desktop')
  await p.goto('/configuracoes')
  await p.getByRole('button', { name: 'Excluir minha conta' }).click()
  await pausa(p)
  await foto('excluir-conta')
  await p.keyboard.press('Escape')
  await p.goto('/sugestoes')
  await p.getByRole('heading', { name: 'Sugestões' }).waitFor()
  await p.getByRole('button', { name: 'Nova sugestão' }).click()
  await pausa(p)
  await p.getByLabel('Título').fill('Mostrar gráfico por categoria')
  await p
    .getByLabel('Conte os detalhes')
    .fill('Queria ver no período quanto gastei em cada categoria, num gráfico.')
  await pausa(p, 300)
  await foto('sugestao-nova')
  await p.keyboard.press('Escape')
  if (t === 'celular') {
    await p.goto('/')
    await pausa(p, 1000)
    await p.getByRole('button', { name: 'Mais' }).click()
    await pausa(p)
    await foto('menu-mais')
  }

  // conta nova, cadastro incompleto: o início mostra "Continue seu cadastro"
  await ctx.clearCookies()
  await p.request.post('/api/auth/cadastro', {
    headers: { 'X-Suricate': '1' },
    data: {
      nome: 'Caio Lima',
      email: `caio.${t}${Date.now()}@exemplo.com`,
      senha: SENHA,
      aceite_termos: true,
    },
  })
  await p.request.put('/api/onboarding/etapas/boas_vindas', {
    headers: { 'X-Suricate': '1' },
    data: { apelido: 'Caio', objetivo: 'juntar_dinheiro', objetivo_outro: '' },
  })
  await p.goto('/')
  await p.getByLabel('Dia do salário').waitFor()
  await pausa(p)
  await (
    t === 'celular'
      ? p.getByRole('link', { name: 'Pular', exact: true })
      : p.locator('.sf-cadastro-lado a[href="/"]')
  ).click()
  await p.getByTestId('continuar-cadastro').waitFor()
  await pausa(p, 800)
  await foto('inicio-continuar')
  await ctx.clearCookies()
  await p.goto('/esqueci-a-senha')
  await p.locator('h1').waitFor()
  await pausa(p)
  await foto('esqueci-a-senha')
  await ctx.close()
}
await b.close()
console.log('ok')
