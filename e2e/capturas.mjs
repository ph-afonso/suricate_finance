// Capturas de tela para relatórios e docs de uso, no celular (360 px) e no desktop (1440 px).
// Uso: E2E_BASE_URL=http://localhost:9001 node capturas.mjs <pasta-de-saída> /rota:nome[:clique>clique] ...
// Os cliques opcionais são nomes de botões ou textos visíveis, em ordem (ex.: /:menu-mais:Mais).
// Um clique com prefixo "celular=" ou "desktop=" só acontece naquela tela.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const [saida, ...paginas] = process.argv.slice(2)
if (!saida || !paginas.length) {
  console.error('Uso: node capturas.mjs <pasta-de-saída> /rota:nome [/rota:nome ...]')
  process.exit(1)
}
const base = process.env.E2E_BASE_URL || 'http://localhost:9000'
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const telas = {
  celular: { viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { viewport: { width: 1440, height: 900 } },
}

mkdirSync(saida, { recursive: true })
const navegador = await chromium.launch()
for (const [tela, opcoes] of Object.entries(telas)) {
  const contexto = await navegador.newContext({
    ...opcoes,
    locale: 'pt-BR',
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
  })
  const pagina = await contexto.newPage()
  for (const item of paginas) {
    const [rota, nome, cliques = ''] = item.split(':')
    await pagina.goto(base + rota, { waitUntil: 'networkidle' })
    for (let alvo of cliques.split('>').filter(Boolean)) {
      const [so, resto] = alvo.split('=')
      if (resto !== undefined) {
        if (so !== tela) continue
        alvo = resto
      }
      await pagina.getByRole('button', { name: alvo }).or(pagina.getByText(alvo, { exact: true })).first().click()
      await pagina.waitForTimeout(400)
    }
    await pagina.waitForTimeout(500)
    const arquivo = join(saida, `${nome}-${tela}.png`)
    await pagina.screenshot({ path: arquivo, fullPage: tela === 'desktop' })
    console.log(arquivo)
  }
  await contexto.close()
}
await navegador.close()
