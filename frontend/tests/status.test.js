import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { largura, montarApp, respostaJson } from './helpers'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

const ambiente = (nome, no_ar) => ({
  nome,
  no_ar,
  versao: no_ar ? '0.1.0' : null,
  banco: no_ar ? 'ok' : null,
  tempo_ms: no_ar ? 210 : null,
})

const STATUS = {
  atualizado_em: '2026-10-16T21:22:00Z',
  ambientes: [ambiente('Produção', true), ambiente('Pré-produção', false), ambiente('Desenvolvimento', true)],
  deploys: [
    {
      ambiente: 'Desenvolvimento',
      ramo: 'develop',
      commit: 'Merge pull request #116',
      estado: 'ready',
      quando: '2026-10-16T21:20:00Z',
    },
  ],
  pipeline: { estado: 'completed', conclusao: 'failure', ramo: 'develop', url: 'https://github.com/x' },
}

async function abrirStatus(corpo) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => respostaJson(corpo)),
  )
  largura(1440)
  const { wrapper } = await montarApp('/status')
  await flushPromises()
  return wrapper
}

describe('CT14 · página de status', () => {
  it('mostra os três ambientes e o que está fora aparece em vermelho', async () => {
    const wrapper = await abrirStatus(STATUS)
    expect(fetch).toHaveBeenCalledWith('/api/status', expect.anything())
    const cards = wrapper.findAll('[data-testid="ambiente"]')
    expect(cards.map((c) => c.find('b').text())).toEqual(['Produção', 'Pré-produção', 'Desenvolvimento'])

    const fora = cards[1]
    expect(fora.text()).toContain('fora do ar')
    expect(fora.find('.q-badge').classes()).toContain('bg-negative')
    expect(cards[0].find('.q-badge').classes()).toContain('bg-positive')
    expect(cards[0].text()).toContain('210 ms')

    const resumo = wrapper.find('[data-testid="resumo"]')
    expect(resumo.text()).toContain('Há ambiente fora do ar')
    expect(resumo.classes()).toContain('bg-warning')
  })

  it('com tudo no ar, o resumo fica verde', async () => {
    const wrapper = await abrirStatus({
      ...STATUS,
      ambientes: STATUS.ambientes.map((a) => ({ ...ambiente(a.nome, true) })),
    })
    const resumo = wrapper.find('[data-testid="resumo"]')
    expect(resumo.text()).toContain('Todos os ambientes estão no ar.')
    expect(resumo.classes()).toContain('bg-positive')
  })

  it('mostra os últimos deploys e o resultado da pipeline', async () => {
    const wrapper = await abrirStatus(STATUS)
    expect(wrapper.text()).toContain('Merge pull request #116')
    expect(wrapper.text()).toContain('falhou')
  })
})
