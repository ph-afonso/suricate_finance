// CT37 (RNF07): telas de login e do cadastro guiado com rótulo em todos os campos, foco visível e uso só
// pelo teclado. O axe confere as regras WCAG 2.1 A e AA que dá para verificar automaticamente.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { emailDeTeste, entrarComContaNova, SENHA } from './apoio.js'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function semViolacoes(page) {
  // Com transições no meio (ex.: a notificação de conquista entrando), o axe mede cores semitransparentes
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG)
    // Falso positivo conhecido do axe: no rodapé fixo (sticky) do cadastro guiado ele mede o botão principal
    // contra o fundo da página, não contra o terracota do botão. O contraste dele é conferido por
    // contrasteDoBotao(), e o rótulo, pelo getByRole('button', { name }) dos testes.
    .exclude('.sf-cadastro-rodape .q-btn--unelevated')
    .analyze()
  const resumo = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )
  expect(resumo, 'violações de acessibilidade').toEqual([])
}

// Contraste entre o texto e o fundo do próprio botão (WCAG 1.4.3: 4,5:1 para texto normal)
async function contrasteDoBotao(botao) {
  return botao.evaluate((el) => {
    const rgb = (c) =>
      c
        .match(/\d+(\.\d+)?/g)
        .slice(0, 3)
        .map(Number)
    const lum = (c) => {
      const [r, g, b] = rgb(c).map((v) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const s = getComputedStyle(el)
    const [a, b] = [lum(s.color), lum(s.backgroundColor)].sort((x, y) => y - x)
    return (a + 0.05) / (b + 0.05)
  })
}

// O elemento focado mostra o foco (WCAG 2.4.7): contorno nos botões, chips e links (app.scss) ou a borda
// de foco do Quasar nos campos de texto
async function focoVisivel(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return false
    if (el.closest('.q-field')) return el.closest('.q-field').classList.contains('q-field--focused')
    const s = getComputedStyle(el)
    return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2
  })
}

for (const rota of ['/entrar', '/criar-conta', '/esqueci-a-senha', '/redefinir-senha?token=x']) {
  test(`CT37 · ${rota} sem violações de acessibilidade`, async ({ page }) => {
    await page.goto(rota)
    await expect(page.locator('h1')).toBeVisible()
    await semViolacoes(page)
  })
}

test('CT37 · entrar só com o teclado, com o foco sempre visível', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado físico é cenário de desktop')
  const email = await entrarComContaNova(page)
  await page.context().clearCookies()
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: 'Suricate Finance' })).toBeVisible()

  // Tab até o campo de e-mail, passando pelos controles anteriores com foco visível
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    expect(await focoVisivel(page), `foco visível no ${i + 1}º Tab`).toBe(true)
    if (await page.getByLabel('E-mail').evaluate((el) => el === document.activeElement)) break
  }
  await expect(page.getByLabel('E-mail')).toBeFocused()
  await page.keyboard.type(email)
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Senha')).toBeFocused()
  await page.keyboard.type(SENHA)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/$|\/\?/)
})

test('CT37 · cadastro guiado sem violações e com as escolhas pelo teclado', async ({ page, isMobile }) => {
  await entrarComContaNova(page, { concluirCadastro: false })
  await page.goto('/cadastro-guiado/boas_vindas')
  await expect(page.getByLabel('Como posso te chamar?')).toBeVisible()
  await semViolacoes(page)

  if (isMobile) return
  await page.getByLabel('Como posso te chamar?').fill('Teca')
  // Chips de opção: Tab chega neles e Enter escolhe
  const opcao = page.getByRole('radio', { name: 'Juntar dinheiro' })
  await opcao.focus()
  expect(await focoVisivel(page)).toBe(true)
  await page.keyboard.press('Enter')
  await expect(opcao).toHaveAttribute('aria-checked', 'true')
  const continuar = page.getByRole('button', { name: 'Continuar' })
  expect(await contrasteDoBotao(continuar)).toBeGreaterThanOrEqual(4.5)
  await continuar.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/cadastro-guiado\/renda$/)
  await semViolacoes(page)
})

test('CT37 · criar conta pelo teclado: o aceite dos termos marca com a barra de espaço', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'teclado físico é cenário de desktop')
  await page.goto('/criar-conta')
  await page.getByLabel('Nome').fill('Teste Teclado')
  await page.getByLabel('E-mail').fill(emailDeTeste())
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('checkbox').focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: 'Criar conta' })).toBeEnabled()
})
