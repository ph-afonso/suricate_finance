// CT10: confere o build PWA (dist/pwa) depois de `npm run build`. Falha com a lista do que faltar.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/pwa/', import.meta.url))
const problemas = []
const arquivo = (nome) => join(dist, nome)

for (const nome of ['index.html', 'manifest.json', 'sw.js']) {
  if (!existsSync(arquivo(nome))) problemas.push(`falta ${nome}`)
}

if (existsSync(arquivo('manifest.json'))) {
  const m = JSON.parse(readFileSync(arquivo('manifest.json'), 'utf8'))
  const esperado = {
    name: 'Suricate Finance',
    theme_color: '#A85A2A',
    background_color: '#FBF7F2',
    lang: 'pt-BR',
  }
  for (const [chave, valor] of Object.entries(esperado)) {
    if (m[chave] !== valor) problemas.push(`manifest.${chave} = ${m[chave]} (esperado ${valor})`)
  }
  const tamanhos = (m.icons || []).map((i) => i.sizes)
  for (const t of ['192x192', '512x512']) {
    if (!tamanhos.includes(t)) problemas.push(`manifest sem ícone ${t}`)
  }
  for (const i of m.icons || []) {
    if (!existsSync(arquivo(i.src))) problemas.push(`ícone não gerado: ${i.src}`)
  }
}

if (existsSync(arquivo('sw.js')) && !readFileSync(arquivo('sw.js'), 'utf8').includes('/api')) {
  problemas.push('sw.js não exclui /api do cache')
}

if (problemas.length) {
  console.error(`Build PWA com problemas:\n- ${problemas.join('\n- ')}`)
  process.exit(1)
}
console.log('Build PWA ok: index.html, manifest.json, sw.js e ícones.')
