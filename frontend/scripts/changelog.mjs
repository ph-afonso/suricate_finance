// Converte o CHANGELOG.md em JSON para a página Novidades (RF49).
// Formato esperado: "## Ainda não publicado" e "## <versão> · <dd/mm/aaaa>", cada item numa linha "- ".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const destino = resolve(raiz, 'frontend/src/assets/changelog.json')

export function converter(markdown) {
  const resultado = { emPreparacao: [], versoes: [] }
  let atual = null
  for (const linha of markdown.split(/\r?\n/)) {
    const titulo = linha.match(/^##\s+(.+?)\s*$/)
    if (titulo) {
      const texto = titulo[1]
      const versao = texto.match(/^(\d+\.\d+\.\d+(?:-[\w.]+)?)\s*·\s*(\d{2}\/\d{2}\/\d{4})$/)
      if (/^ainda não publicado$/i.test(texto)) atual = resultado.emPreparacao
      else if (versao) {
        const entrada = { versao: versao[1], data: versao[2], itens: [] }
        resultado.versoes.push(entrada)
        atual = entrada.itens
      } else atual = null
      continue
    }
    const item = linha.match(/^\s*-\s+(.+)$/)
    if (item && atual) atual.push(item[1].trim())
  }
  return resultado
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dados = converter(readFileSync(resolve(raiz, 'CHANGELOG.md'), 'utf8'))
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, JSON.stringify(dados, null, 2) + '\n')
  console.log(
    `changelog.json: ${dados.versoes.length} versão(ões), ${dados.emPreparacao.length} item(ns) em preparação`,
  )
}
