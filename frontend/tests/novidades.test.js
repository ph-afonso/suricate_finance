import { describe, expect, it } from 'vitest'
import { converter } from '../scripts/changelog.mjs'
import { useNovidades } from 'src/composables/useNovidades'

const MD = `# Novidades

## Ainda não publicado

- Item futuro

## 0.2.0 · 20/11/2026

- Agora dá para dividir o cartão do casal.
- Correção no painel.

## 0.1.0 · 25/10/2026

- Primeira versão.
`

describe('conversor do CHANGELOG.md', () => {
  it('separa as versões publicadas, da mais nova para a mais antiga, e o que está em preparação', () => {
    const dados = converter(MD)
    expect(dados.emPreparacao).toEqual(['Item futuro'])
    expect(dados.versoes.map((v) => v.versao)).toEqual(['0.2.0', '0.1.0'])
    expect(dados.versoes[0]).toEqual({
      versao: '0.2.0',
      data: '20/11/2026',
      itens: ['Agora dá para dividir o cartão do casal.', 'Correção no painel.'],
    })
  })
})

describe('CT16 e CT17 · Novidades', () => {
  it('CT16: lista as versões e indica a mais nova', () => {
    const { versoes, ultima } = useNovidades(converter(MD))
    expect(versoes.value).toHaveLength(2)
    expect(ultima.value).toBe('0.2.0')
  })

  it('CT17: o selo aparece com versão nova e some depois de abrir a página', () => {
    localStorage.clear()
    const n = useNovidades(converter(MD))
    expect(n.temNovidade.value).toBe(true)
    n.marcarComoVista()
    expect(n.temNovidade.value).toBe(false)
  })

  it('sem versão publicada não há selo', () => {
    const { temNovidade } = useNovidades(converter('## Ainda não publicado\n\n- algo\n'))
    expect(temNovidade.value).toBe(false)
  })
})
