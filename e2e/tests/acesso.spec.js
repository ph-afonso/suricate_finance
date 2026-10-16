// CT34–CT36 (M2): criar conta, fazer o cadastro guiado inteiro, retomar e refazer uma etapa,
// no celular (360 px) e no desktop (1440 px).
import { test, expect } from '@playwright/test'
import { emailDeTeste, entrarComContaNova, SENHA } from './apoio.js'

const continuar = (page) => page.getByRole('button', { name: /^(Continuar|Concluir|Salvar)$/ }).click()

async function criarConta(page, email) {
  await page.goto('/entrar')
  await page.getByRole('link', { name: 'Ainda não tenho conta' }).click()
  await page.getByLabel('Nome').fill('Ana Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('checkbox').click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/cadastro-guiado\/boas_vindas$/)
}

test('CT34 · criar a conta e fazer as 7 etapas até o fechamento', async ({ page, isMobile }) => {
  await criarConta(page, emailDeTeste())

  // 1. Boas-vindas
  await page.getByLabel('Como posso te chamar?').fill('Ana')
  await page.getByRole('radio', { name: 'Quitar dívida' }).click()
  await continuar(page)
  await expect(page.getByText('Conquista desbloqueada: Primeiro passo')).toBeVisible()

  // 2. Renda
  await page.getByLabel('Dia do salário').fill('15')
  await page.getByLabel('Valor médio').fill('5200')
  await page.getByRole('radio', { name: 'Antecipa' }).click()
  await continuar(page)

  // 3. Contas
  await page.getByLabel('Nome da conta').fill('Conta Familiar')
  await page.getByRole('radio', { name: 'Inter' }).click()
  await page.getByRole('radio', { name: 'Familiar' }).click()
  await page.getByRole('button', { name: 'Adicionar conta' }).click()
  await continuar(page)

  // 4. Cartões
  await page.getByLabel('Cartão').fill('Leroy Pay')
  await page.getByLabel('Limite').fill('3000')
  await page.getByLabel('Fecha dia').fill('1')
  await page.getByLabel('Vence dia').fill('10')
  await page.getByRole('button', { name: 'Adicionar cartão' }).click()
  await expect(page.getByText(/Compras no Leroy Pay a partir do dia 1/)).toBeVisible()
  await continuar(page)

  // 5. Contas fixas
  await page.locator('.q-chip').filter({ hasText: 'Aluguel' }).click()
  await page.getByLabel('Valor', { exact: true }).fill('2000')
  await continuar(page)

  // 6. Família
  await page.getByText('Divido contas com alguém').click()
  await page.getByLabel('Com quem').fill('Agatha')
  await page.getByRole('radio', { name: 'Conta Familiar' }).click()
  await page.getByText(/^Aluguel · sua parte/).click()
  await continuar(page)

  // 7. Objetivos
  await page.locator('.q-chip').filter({ hasText: 'Reserva de emergência' }).click()
  await page.getByLabel('Débito e Pix').fill('300')
  if (!isMobile) await expect(page.getByTestId('previa')).toContainText('Sobra estimada por período')
  await continuar(page)

  await expect(page.getByRole('heading', { name: 'Tudo pronto, Ana!' })).toBeVisible()
  await expect(page.getByText('Conquistas: 7 de 7').first()).toBeVisible()
  await page.getByRole('link', { name: 'Ver meu período' }).click()
  await expect(page.getByRole('heading', { name: 'Oi, Ana!' })).toBeVisible()
  await expect(page.getByTestId('continuar-cadastro')).toHaveCount(0)
})

test('CT35 · sair no meio do cadastro e entrar de novo volta na mesma etapa', async ({ page, context }) => {
  const email = emailDeTeste()
  await criarConta(page, email)
  await page.getByLabel('Como posso te chamar?').fill('Bia')
  await page.getByRole('radio', { name: 'Juntar dinheiro' }).click()
  await continuar(page)
  await expect(page).toHaveURL(/\/cadastro-guiado\/renda$/)

  await context.clearCookies()
  await page.goto('/')
  await expect(page).toHaveURL(/\/entrar/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/cadastro-guiado\/renda$/)
})

test('CT36 · refazer a etapa Cartões em Configurações', async ({ page }) => {
  await entrarComContaNova(page)
  await page.goto('/configuracoes?aba=cadastro')
  await page.locator('.q-page .q-item').filter({ hasText: 'Cartões' }).getByRole('link').click()
  await expect(page).toHaveURL(/\/cadastro-guiado\/cartoes\?refazer=1$/)
  await page.getByLabel('Cartão').fill('Nubank')
  await page.getByLabel('Fecha dia').fill('3')
  await page.getByLabel('Vence dia').fill('12')
  await page.getByRole('button', { name: 'Adicionar cartão' }).click()
  await continuar(page)
  await expect(page).toHaveURL(/\/configuracoes\?aba=cadastro$/)
  await expect(page.locator('.q-page .q-item').filter({ hasText: 'Cartões' })).toContainText('Concluída')
})

test('sem login, uma tela interna leva para entrar', async ({ page }) => {
  await page.goto('/sugestoes')
  await expect(page).toHaveURL(/\/entrar\?volta=(%2F|\/)sugestoes$/)
  await expect(page.getByRole('link', { name: /Entrar com Google/ })).toBeVisible()
})
