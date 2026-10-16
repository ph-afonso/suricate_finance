// CT11, CT14 e CT16 de ponta a ponta, no celular (360 px) e no desktop (1440 px).
import { test, expect } from '@playwright/test'

test('a página inicial mostra a API e o banco no ar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Suricate Finance' })).toBeVisible()
  await expect(page.getByTestId('banco')).toHaveText('banco: ok')
  await expect(page.getByTestId('versao')).toHaveText(/\d+\.\d+\.\d+/)
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
})

test('um endereço que não existe mostra a página do Suri', async ({ page }) => {
  await page.goto('/endereco-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})
