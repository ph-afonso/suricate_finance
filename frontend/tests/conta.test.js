// Sugestões (#106) e Configurações do M2 (perfil, refazer etapas e excluir conta, RF04 e D3).
// Os diálogos do Quasar são renderizados no <body>, fora do wrapper: por isso as buscas em document.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useSessao } from 'src/composables/useSessao'
import { montarApp, respostaJson } from './helpers'

const USUARIO = {
  nome: 'Ana',
  apelido: 'Aninha',
  email: 'ana@teste.com',
  tem_senha: true,
  tem_google: false,
  termos_pendentes: false,
  onboarding: { etapa_atual: 7, concluido: true },
}

const SUGESTOES = [
  {
    codigo: 'S-7F3K',
    tipo: 'melhoria',
    titulo: 'Gráfico por categoria',
    status: 'planejada',
    criada_em: '2026-10-16T12:00:00',
  },
  {
    codigo: 'S-2B9Q',
    tipo: 'problema',
    titulo: 'Tema escuro some',
    status: 'entregue',
    criada_em: '2026-10-15T12:00:00',
  },
]

function servidor(rotas = {}) {
  const fetch = vi.fn((url, opcoes = {}) => {
    const chave = `${opcoes.method || 'GET'} ${url.replace('/api/', '')}`
    const [corpo, status = 200] = rotas[chave] || [{ detail: 'Não encontrado' }, 404]
    return respostaJson(corpo, status)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
const corpoDe = (fetch, chave) =>
  JSON.parse(
    fetch.mock.calls.find(([url, o = {}]) => `${o.method || 'GET'} ${url.replace('/api/', '')}` === chave)[1]
      .body,
  )

const noBody = (seletor) => [...document.body.querySelectorAll(seletor)]
const botaoNoBody = (texto) => noBody('button').find((b) => b.textContent.trim() === texto)
const campoNoBody = (rotulo) =>
  noBody('.q-field').find((f) => f.querySelector('.q-field__label')?.textContent.trim() === rotulo)

async function digitar(campo, valor) {
  const entrada = campo.querySelector('input, textarea')
  entrada.value = valor
  entrada.dispatchEvent(new Event('input'))
  await flushPromises()
}

beforeEach(() => {
  const s = useSessao()
  s.usuario.value = { ...USUARIO }
  s.carregado.value = true
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('Sugestões (#106)', () => {
  it('lista as sugestões com o código e o status em português', async () => {
    servidor({ 'GET sugestoes': [SUGESTOES] })
    const { wrapper } = await montarApp('/sugestoes')
    const itens = wrapper.findAll('[data-testid="sugestao"]')
    expect(itens).toHaveLength(2)
    expect(itens[0].text()).toContain('Gráfico por categoria')
    expect(itens[0].text()).toContain('Melhoria · S-7F3K')
    expect(itens[0].text()).toContain('Planejada')
    expect(itens[1].text()).toContain('Entregue')
  })

  it('sem sugestões, mostra o aviso de lista vazia', async () => {
    servidor({ 'GET sugestoes': [[]] })
    const { wrapper } = await montarApp('/sugestoes')
    expect(wrapper.text()).toContain('Você ainda não mandou nenhuma sugestão.')
  })

  it('a nova sugestão vai com o tipo, o texto e a tela de origem, e entra no topo da lista', async () => {
    const nova = {
      codigo: 'S-9X1A',
      tipo: 'ideia',
      titulo: 'Modo viagem',
      status: 'recebida',
      criada_em: '2026-10-20T12:00:00',
    }
    const fetch = servidor({ 'GET sugestoes': [SUGESTOES], 'POST sugestoes': [nova, 201] })
    const { wrapper } = await montarApp('/sugestoes')

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Nova sugestão'))
      .trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('sem seu nome nem seu e-mail')
    noBody('[role="radio"]')
      .find((r) => r.textContent.trim() === 'Ideia')
      .click()
    await digitar(campoNoBody('Título'), 'Modo viagem')
    await digitar(campoNoBody('Conte os detalhes'), 'Separar os gastos de uma viagem do resto do período.')
    noBody('form').at(-1).dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(corpoDe(fetch, 'POST sugestoes')).toMatchObject({
      tipo: 'ideia',
      titulo: 'Modo viagem',
      descricao: 'Separar os gastos de uma viagem do resto do período.',
    })
    expect(corpoDe(fetch, 'POST sugestoes')).toHaveProperty('tela')
    await vi.waitFor(() => expect(wrapper.findAll('[data-testid="sugestao"]')).toHaveLength(3))
    expect(wrapper.find('[data-testid="sugestao"]').text()).toContain('Modo viagem')
  })

  it('a 6ª sugestão do dia mostra o aviso de limite da API (CT30)', async () => {
    const limite = 'Você já mandou 5 sugestões hoje. Tente amanhã.'
    servidor({ 'GET sugestoes': [SUGESTOES], 'POST sugestoes': [{ detail: limite }, 429] })
    const { wrapper } = await montarApp('/sugestoes')
    const aviso = vi.spyOn(wrapper.vm.$q, 'notify')
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Nova sugestão'))
      .trigger('click')
    await flushPromises()
    await digitar(campoNoBody('Título'), 'Mais uma')
    await digitar(campoNoBody('Conte os detalhes'), 'Texto com mais de dez letras.')
    noBody('form').at(-1).dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(aviso).toHaveBeenCalledWith({ type: 'negative', message: limite }))
    expect(wrapper.findAll('[data-testid="sugestao"]')).toHaveLength(2)
  })
})

describe('Configurações (RF04, D3)', () => {
  const ETAPAS = [
    { chave: 'boas_vindas', titulo: 'Boas-vindas', conquista: 'Primeiro passo', status: 'concluida' },
    { chave: 'cartoes', titulo: 'Cartões', conquista: 'Vigia do cartão', status: 'pulada' },
  ]

  it('a aba Cadastro guiado mostra o status de cada etapa e leva para refazer', async () => {
    servidor({ 'GET onboarding': [{ etapas: ETAPAS }] })
    const { wrapper } = await montarApp('/configuracoes?aba=cadastro')
    await flushPromises()
    const itens = wrapper.findAll('.q-page .q-item')
    expect(itens[0].text()).toContain('Concluída')
    expect(itens[0].text()).toContain('Refazer')
    expect(itens[1].text()).toContain('Pulada')
    expect(itens[1].text()).toContain('Fazer')
    expect(itens[1].find('a').attributes('href')).toBe('/cadastro-guiado/cartoes?refazer=1')
  })

  it('salvar o perfil manda nome e apelido', async () => {
    const fetch = servidor({
      'GET onboarding': [{ etapas: [] }],
      'PATCH usuario': [{ ...USUARIO, apelido: 'Ana B' }],
    })
    const { wrapper } = await montarApp('/configuracoes')
    await digitar(campoNoBody('Como o Suri te chama'), 'Ana B')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Salvar')
      .trigger('click')
    await flushPromises()
    expect(corpoDe(fetch, 'PATCH usuario')).toEqual({ nome: 'Ana', apelido: 'Ana B' })
    expect(useSessao().usuario.value.apelido).toBe('Ana B')
  })

  it('excluir a conta pede a senha, apaga e volta para entrar (CT29)', async () => {
    const fetch = servidor({ 'GET onboarding': [{ etapas: [] }], 'DELETE usuario': [{}] })
    const { wrapper, router } = await montarApp('/configuracoes')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Excluir minha conta')
      .trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Digite sua senha para confirmar.')
    expect(botaoNoBody('Excluir tudo').disabled).toBe(true)

    await digitar(campoNoBody('Senha'), 'minha-senha')
    botaoNoBody('Excluir tudo').click()
    await flushPromises()
    expect(corpoDe(fetch, 'DELETE usuario')).toEqual({ senha: 'minha-senha' })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/entrar'))
    expect(useSessao().usuario.value).toBeNull()
  })

  it('conta só com Google confirma digitando EXCLUIR; senha errada mostra o erro', async () => {
    useSessao().usuario.value = { ...USUARIO, tem_senha: false, tem_google: true }
    const fetch = servidor({
      'GET onboarding': [{ etapas: [] }],
      'DELETE usuario': [{ detail: 'Digite EXCLUIR para confirmar.' }, 400],
    })
    const { wrapper, router } = await montarApp('/configuracoes')
    expect(wrapper.text()).toContain('Entrada com: Google')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Excluir minha conta')
      .trigger('click')
    await flushPromises()
    await digitar(campoNoBody('EXCLUIR'), 'excluir')
    botaoNoBody('Excluir tudo').click()
    await flushPromises()
    expect(corpoDe(fetch, 'DELETE usuario')).toEqual({ confirmacao: 'excluir' })
    expect(noBody('[role="alert"]').map((a) => a.textContent)).toContain('Digite EXCLUIR para confirmar.')
    expect(router.currentRoute.value.path).toBe('/configuracoes')
  })
})
