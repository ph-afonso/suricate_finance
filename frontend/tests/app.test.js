import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { Dark } from 'quasar'
import { largura, montarApp, respostaJson } from './helpers'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('CT06 · página inicial', () => {
  it('mostra ambiente, versão e banco vindos da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respostaJson({ status: 'ok', ambiente: 'staging', versao: '0.1.0', banco: 'ok' })),
    )
    largura(1440)
    const { wrapper } = await montarApp('/')
    await flushPromises()
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.anything())
    expect(wrapper.find('[data-testid="ambiente"]').text()).toBe('Pré-produção')
    expect(wrapper.find('[data-testid="versao"]').text()).toBe('0.1.0')
    expect(wrapper.find('[data-testid="banco"]').text()).toBe('banco: ok')
  })

  it('mostra o banco indisponível quando a API responde 503', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        respostaJson(
          { status: 'erro', ambiente: 'development', versao: '0.1.0', banco: 'indisponível' },
          503,
        ),
      ),
    )
    const { wrapper } = await montarApp('/')
    await flushPromises()
    expect(wrapper.find('[data-testid="banco"]').text()).toBe('banco: indisponível')
  })

  it('mostra um erro claro quando a API não responde', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('sem rede'))),
    )
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { wrapper } = await montarApp('/')
    await flushPromises()
    expect(wrapper.text()).toContain('Não foi possível falar com a API')
  })
})

describe('CT07 e CT08 · layout', () => {
  it('no celular mostra a barra inferior com os destinos e o seletor de período', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respostaJson({ status: 'ok', ambiente: 'development', versao: '0.1.0', banco: 'ok' })),
    )
    largura(360)
    const { wrapper } = await montarApp('/')
    const nav = wrapper.find('nav[aria-label="Navegação principal"]')
    expect(nav.exists()).toBe(true)
    for (const destino of ['Período', 'Lançamentos', 'Cartões', 'Mais']) expect(nav.text()).toContain(destino)
    expect(nav.find('[aria-label="Novo lançamento"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('15/10/2026 a 14/11/2026')
  })

  it('no desktop mostra a barra lateral, sem a barra inferior', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respostaJson({ status: 'ok', ambiente: 'development', versao: '0.1.0', banco: 'ok' })),
    )
    largura(1440)
    const { wrapper } = await montarApp('/')
    expect(wrapper.find('nav[aria-label="Navegação principal"]').exists()).toBe(false)
    const lateral = wrapper.find('.q-drawer')
    expect(lateral.exists()).toBe(true)
    for (const destino of [
      'Período',
      'Lançamentos',
      'Cartões',
      'Família',
      'Planejamento',
      'Novidades',
      'Status do sistema',
    ])
      expect(lateral.text()).toContain(destino)
  })

  it('um destino ainda não construído mostra em que módulo ele chega', async () => {
    largura(1440)
    const { wrapper } = await montarApp('/cartoes')
    expect(wrapper.text()).toContain('M5 · Cartões')
  })
})

describe('CT09 · tema escuro', () => {
  it('troca a classe do body, que troca os tokens de cor', async () => {
    Dark.set(true)
    expect(document.body.classList.contains('body--dark')).toBe(true)
    Dark.set(false)
    expect(document.body.classList.contains('body--light')).toBe(true)
  })
})
