// CT11, CT12, CT13, CT14 e CT16 de ponta a ponta, no celular (360 px) e no desktop (1440 px).
import { test, expect } from '@playwright/test'

test('a página inicial mostra a API e o banco no ar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Suricate Finance' })).toBeVisible()
  await expect(page.getByTestId('banco')).toHaveText('banco: ok')
  await expect(page.getByTestId('versao')).toHaveText(/\d+\.\d+\.\d+/)
})

// CT12 e CT13: cada deploy usa as variáveis (e o banco) do seu ambiente. A pipeline descobre o ramo
// do deploy e informa o ambiente esperado em E2E_AMBIENTE; na máquina local o teste é pulado.
test('o deploy usa o ambiente do seu ramo', async ({ page }) => {
  const esperado = process.env.E2E_AMBIENTE
  test.skip(!esperado, 'sem E2E_AMBIENTE (execução local)')
  await page.goto('/')
  await expect(page.getByTestId('ambiente')).toHaveText(esperado)
  await expect(page.getByTestId('banco')).toHaveText('banco: ok')
})

test('a navegação segue o layout aprovado', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) {
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    await expect(nav).toBeVisible()
    await nav.getByText('Mais').click()
    await page.getByRole('listitem').filter({ hasText: 'Novidades' }).click()
  } else {
    await page.locator('.q-drawer').getByText('Novidades').click()
  }
  await expect(page).toHaveURL(/\/novidades$/)
  await expect(page.getByRole('heading', { name: 'Novidades' })).toBeVisible()
})

test('a página de status lista os ambientes monitorados', async ({ page }) => {
  await page.goto('/status')
  await expect(page.getByRole('heading', { name: 'Status do sistema' })).toBeVisible()
  await expect(page.getByTestId('resumo')).toBeVisible()
  await expect(page.getByTestId('ambiente').first()).toBeVisible()
  // A grade dos ambientes tem a altura dos cartões, sem espaço sobrando embaixo (defeito de 16/10)
  const grade = await page.locator('.sf-grade').boundingBox()
  const cartao = await page.getByTestId('ambiente').first().boundingBox()
  expect(grade.height).toBeLessThan(cartao.height * 4)
  if (grade.width >= 600) expect(grade.height).toBeLessThan(cartao.height + 2)
})

test('um endereço que não existe mostra a página do Suri', async ({ page }) => {
  await page.goto('/endereco-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})
