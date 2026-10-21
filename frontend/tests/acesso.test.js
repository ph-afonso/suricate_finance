// Telas de acesso (RF01, etapa 3 do M2): entrar, criar conta, esqueci e redefinir a senha.
// A API é simulada: cada teste diz o que cada rota responde e confere o que a tela mandou.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api, useSessao } from 'src/composables/useSessao'
import { montarApp, respostaJson } from './helpers'

const RESUMO = { nome: 'Ana', termos_pendentes: false, onboarding: { etapa_atual: 3, concluido: false } }

// rotas: { 'POST auth/entrar': [corpo, status] }; o que não estiver na lista responde 404
function servidor(rotas = {}) {
  const fetch = vi.fn((url, opcoes = {}) => {
    const chave = `${opcoes.method || 'GET'} ${url.replace('/api/', '')}`
    const [corpo, status = 200] = rotas[chave] || [{ detail: 'Não encontrado' }, 404]
    return respostaJson(corpo, status)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const chamada = (fetch, chave) =>
  fetch.mock.calls.find(([url, o = {}]) => `${o.method || 'GET'} ${url.replace('/api/', '')}` === chave)
const corpoDe = (fetch, chave) => JSON.parse(chamada(fetch, chave)[1].body)

async function preencher(wrapper, rotulo, valor) {
  const campo = wrapper.findAll('.q-field').find((f) => f.find('.q-field__label').text() === rotulo)
  await campo.find('input').setValue(valor)
}

// As telas são carregadas sob demanda: a navegação termina depois do import da página
const chegouEm = (router, caminho) => vi.waitFor(() => expect(router.currentRoute.value.path).toBe(caminho))

// O aviso da tela é um q-banner; o erro de validação de um campo também usa role="alert"
const aviso = (wrapper) => wrapper.find('.q-banner[role="alert"]')

const botao = (wrapper, texto) => wrapper.findAll('button').find((b) => b.text() === texto)

beforeEach(() => {
  useSessao().usuario.value = null
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('chamadas à API', () => {
  it('todo pedido leva o cabeçalho X-Suricate (CSRF, CT23) e o cookie do mesmo domínio', async () => {
    const fetch = servidor({ 'POST auth/sair': [{}] })
    await api('auth/sair', { metodo: 'POST' })
    const [, opcoes] = fetch.mock.calls[0]
    expect(opcoes.headers['X-Suricate']).toBe('1')
    expect(opcoes.credentials).toBe('same-origin')
  })

  it('o erro de validação (422) vira uma frase em português com o nome do campo (CT27)', async () => {
    servidor({
      'PUT onboarding/etapas/renda': [
        { detail: [{ type: 'less_than_equal', loc: ['body', 'dia'], msg: '...', ctx: { le: 31 } }] },
        422,
      ],
    })
    await expect(api('onboarding/etapas/renda', { metodo: 'PUT', corpo: { dia: 32 } })).rejects.toThrow(
      'Dia: use no máximo 31.',
    )
  })

  it('erro do servidor sem mensagem vira um aviso amigável', async () => {
    servidor({ 'GET auth/eu': [{}, 500] })
    await expect(api('auth/eu')).rejects.toThrow('O Suricate não respondeu agora')
  })
})

describe('T01 · entrar', () => {
  it('com a senha certa, entra e segue para o cadastro guiado incompleto', async () => {
    const fetch = servidor({ 'POST auth/entrar': [RESUMO] })
    const { wrapper, router } = await montarApp('/entrar')
    await preencher(wrapper, 'E-mail', 'ana@teste.com')
    await preencher(wrapper, 'Senha', 'senha-certa')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(corpoDe(fetch, 'POST auth/entrar')).toEqual({ email: 'ana@teste.com', senha: 'senha-certa' })
    await chegouEm(router, '/cadastro-guiado')
  })

  it('com a senha errada, mostra a mensagem genérica da API e continua na tela (CT20)', async () => {
    servidor({ 'POST auth/entrar': [{ detail: 'E-mail ou senha incorretos.' }, 401] })
    const { wrapper, router } = await montarApp('/entrar')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(aviso(wrapper).text()).toBe('E-mail ou senha incorretos.')
    expect(router.currentRoute.value.path).toBe('/entrar')
  })

  it('volta para a tela pedida antes do login, se o cadastro já terminou', async () => {
    servidor({ 'POST auth/entrar': [{ ...RESUMO, onboarding: { concluido: true } }] })
    const { wrapper, router } = await montarApp('/entrar?volta=/sugestoes')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await chegouEm(router, '/sugestoes')
  })

  it('mostra o erro que volta do Google na URL e o botão leva ao início do login com Google', async () => {
    servidor()
    const { wrapper } = await montarApp('/entrar?erro=Não foi possível entrar com o Google.')
    expect(aviso(wrapper).text()).toContain('Não foi possível entrar com o Google.')
    expect(wrapper.find('a[href="/api/auth/google/inicio"]').exists()).toBe(true)
  })
})

describe('T02 · criar conta', () => {
  it('o botão só habilita com o aceite dos termos, e o aceite vai para a API', async () => {
    const fetch = servidor({ 'POST auth/cadastro': [RESUMO, 201] })
    const { wrapper, router } = await montarApp('/criar-conta')
    expect(botao(wrapper, 'Criar conta').attributes('disabled')).toBeDefined()

    await preencher(wrapper, 'Nome', 'Ana Teste')
    await preencher(wrapper, 'E-mail', 'ana@teste.com')
    await preencher(wrapper, 'Senha', '12345678')
    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(botao(wrapper, 'Criar conta').attributes('disabled')).toBeUndefined()

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(corpoDe(fetch, 'POST auth/cadastro')).toEqual({
      nome: 'Ana Teste',
      email: 'ana@teste.com',
      senha: '12345678',
      aceite_termos: true,
    })
    await chegouEm(router, '/cadastro-guiado')
  })

  it('e-mail que já tem conta mostra o aviso da API (CT19)', async () => {
    servidor({ 'POST auth/cadastro': [{ detail: 'Já existe uma conta com este e-mail.' }, 409] })
    const { wrapper } = await montarApp('/criar-conta')
    await preencher(wrapper, 'Senha', '12345678')
    await wrapper.find('[role="checkbox"]').trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(aviso(wrapper).text()).toBe('Já existe uma conta com este e-mail.')
  })

  it('os links dos termos e da privacidade abrem as páginas legais', async () => {
    servidor()
    const { wrapper } = await montarApp('/criar-conta')
    const links = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(links).toEqual(expect.arrayContaining(['/termos', '/privacidade']))
  })
})

describe('esqueci e redefinir a senha (CT25)', () => {
  it('esqueci a senha mostra a mesma resposta da API e esconde o formulário', async () => {
    const mensagem = 'Se o e-mail tiver conta, mandamos o link. Confira também o spam.'
    const fetch = servidor({ 'POST auth/senha/esqueci': [{ mensagem }, 202] })
    const { wrapper } = await montarApp('/esqueci-a-senha')
    await preencher(wrapper, 'E-mail', 'quem@teste.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(corpoDe(fetch, 'POST auth/senha/esqueci')).toEqual({ email: 'quem@teste.com' })
    expect(wrapper.find('[role="status"]').text()).toBe(mensagem)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('sem o token no link, avisa e não deixa salvar', async () => {
    servidor()
    const { wrapper } = await montarApp('/redefinir-senha')
    expect(aviso(wrapper).text()).toContain('Link incompleto')
    expect(botao(wrapper, 'Salvar e entrar').attributes('disabled')).toBeDefined()
  })

  it('com o token, troca a senha, já entra e segue para o cadastro guiado', async () => {
    const fetch = servidor({ 'POST auth/senha/redefinir': [RESUMO] })
    const { wrapper, router } = await montarApp('/redefinir-senha?token=abc123')
    await preencher(wrapper, 'Senha nova', 'nova-senha-1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(corpoDe(fetch, 'POST auth/senha/redefinir')).toEqual({ token: 'abc123', senha: 'nova-senha-1' })
    expect(useSessao().usuario.value).toEqual(RESUMO)
    await chegouEm(router, '/cadastro-guiado')
  })

  it('link já usado ou vencido mostra o erro e o atalho para pedir outro', async () => {
    servidor({ 'POST auth/senha/redefinir': [{ detail: 'Este link venceu ou já foi usado.' }, 400] })
    const { wrapper } = await montarApp('/redefinir-senha?token=velho')
    await preencher(wrapper, 'Senha nova', 'nova-senha-1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    const alerta = aviso(wrapper)
    expect(alerta.text()).toContain('Este link venceu ou já foi usado.')
    expect(alerta.find('a[href="/esqueci-a-senha"]').exists()).toBe(true)
  })
})
