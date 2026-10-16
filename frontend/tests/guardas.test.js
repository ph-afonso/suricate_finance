import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import routes from 'src/router/routes'
import { instalarGuardas } from 'src/router/guardas'
import { destinoDepoisDoLogin, useSessao } from 'src/composables/useSessao'
import { respostaJson } from './helpers'

const LOGADO = {
  nome: 'Ana',
  termos_pendentes: false,
  onboarding: { etapa_atual: 3, concluido: false },
}

function roteador() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  instalarGuardas(router)
  return router
}

function api(eu) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => (eu ? respostaJson(eu) : respostaJson({ detail: 'Entre na sua conta' }, 401))),
  )
}

beforeEach(() => {
  const s = useSessao()
  s.carregado.value = false
  s.usuario.value = null
})
afterEach(() => vi.unstubAllGlobals())

describe('CT33 · guardas de rota', () => {
  it('sem sessão, uma tela interna leva a /entrar e guarda para onde voltar', async () => {
    api(null)
    const router = roteador()
    await router.push('/configuracoes')
    expect(router.currentRoute.value.path).toBe('/entrar')
    expect(router.currentRoute.value.query.volta).toBe('/configuracoes')
  })

  it('sem sessão, status, novidades, termos e a página não encontrada abrem', async () => {
    api(null)
    const router = roteador()
    for (const caminho of ['/status', '/novidades', '/termos', '/qualquer-coisa']) {
      await router.push(caminho)
      expect(router.currentRoute.value.path).toBe(caminho)
    }
  })

  it('abrir o app com o cadastro incompleto começa no cadastro guiado (RF04)', async () => {
    api(LOGADO)
    const router = roteador()
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/cadastro-guiado')
    // depois de "Pular", o início abre normalmente
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('com termos pendentes (primeiro login com Google), tudo leva a /boas-vindas', async () => {
    api({ ...LOGADO, termos_pendentes: true })
    const router = roteador()
    await router.push('/sugestoes')
    expect(router.currentRoute.value.path).toBe('/boas-vindas')
  })

  it('quem já entrou não vê de novo as telas de entrar e criar conta', async () => {
    api({ ...LOGADO, onboarding: { etapa_atual: 7, concluido: true } })
    const router = roteador()
    await router.push('/entrar')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('destino depois do login', () => {
    expect(destinoDepoisDoLogin(LOGADO, '/sugestoes')).toBe('/cadastro-guiado')
    const pronto = { ...LOGADO, onboarding: { concluido: true } }
    expect(destinoDepoisDoLogin(pronto, '/sugestoes')).toBe('/sugestoes')
    expect(destinoDepoisDoLogin(pronto, '//site-malicioso.com')).toBe('/')
  })
})
