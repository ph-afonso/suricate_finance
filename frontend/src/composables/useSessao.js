// Sessão do usuário (RF01, RF02). O cookie de sessão é httpOnly: o front só sabe quem está logado
// perguntando à API (GET /api/auth/eu). Toda chamada que altera dados leva o cabeçalho X-Suricate (CSRF).
import { ref } from 'vue'

export class ErroApi extends Error {
  constructor(status, mensagem, detalhes = []) {
    super(mensagem)
    this.status = status
    this.detalhes = detalhes
  }
}

const CAMPOS = {
  apelido: 'Como posso te chamar',
  objetivo: 'Objetivo',
  dia: 'Dia',
  valor_medio: 'Valor médio',
  fim_de_semana: 'Fim de semana',
  dias_atraso: 'Dias de atraso',
  descricao: 'Descrição',
  valor: 'Valor',
  nome: 'Nome',
  banco: 'Banco',
  saldo: 'Saldo',
  limite: 'Limite',
  fechamento: 'Fecha dia',
  vencimento: 'Vence dia',
  total: 'Quantas eram',
  pagas: 'Quantas já paguei',
  com_quem: 'Com quem',
  percentual_outro: 'Percentual',
  limite_cartao: 'Limite do cartão',
  limite_debito: 'Limite de débito e Pix',
  email: 'E-mail',
  senha: 'Senha',
  titulo: 'Título',
}

// O Pydantic responde em inglês; aqui viram frases curtas em português, com o nome do campo
function traduzir({ type, loc = [], msg = '', ctx = {} }) {
  const campo = CAMPOS[[...loc].reverse().find((p) => typeof p === 'string' && CAMPOS[p])] || 'Um campo'
  if (type === 'value_error' || type === 'referencia') return msg.replace(/^Value error, /, '')
  if (type === 'missing') return `${campo}: preencha este campo.`
  if (/_(type|parsing)$/.test(type)) return `${campo}: preencha com um valor válido.`
  if (type === 'greater_than_equal') return `${campo}: use ${ctx.ge} ou mais.`
  if (type === 'less_than_equal') return `${campo}: use no máximo ${ctx.le}.`
  if (type === 'string_too_short') return `${campo}: preencha este campo.`
  if (type === 'string_too_long') return `${campo}: use no máximo ${ctx.max_length} caracteres.`
  if (type === 'literal_error') return `${campo}: escolha uma das opções.`
  return `${campo}: ${msg}`
}

// O FastAPI devolve "detail" como texto ou, na validação (422), como lista de erros por campo
function mensagemDe(corpo, status) {
  const detalhe = corpo?.detail
  if (typeof detalhe === 'string') return detalhe
  if (Array.isArray(detalhe) && detalhe.length) return traduzir(detalhe[0])
  return status >= 500 ? 'O Suricate não respondeu agora. Tente de novo daqui a pouco.' : 'Algo deu errado.'
}

export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const resposta = await fetch(`/api/${caminho}`, {
    method: metodo,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Suricate': '1',
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  })
  const tipo = resposta.headers.get('content-type') || ''
  const dados = tipo.includes('application/json') ? await resposta.json() : null
  if (!resposta.ok) {
    const detalhes = Array.isArray(dados?.detail) ? dados.detail : []
    throw new ErroApi(resposta.status, mensagemDe(dados, resposta.status), detalhes)
  }
  return dados
}

const usuario = ref(null)
const carregado = ref(false)

export function useSessao() {
  async function carregar() {
    try {
      usuario.value = await api('auth/eu')
    } catch (e) {
      if (!(e instanceof ErroApi)) console.warn(e)
      usuario.value = null
    }
    carregado.value = true
    return usuario.value
  }

  async function entrar(email, senha) {
    usuario.value = await api('auth/entrar', { metodo: 'POST', corpo: { email, senha } })
    return usuario.value
  }

  async function cadastrar(dados) {
    usuario.value = await api('auth/cadastro', { metodo: 'POST', corpo: dados })
    return usuario.value
  }

  async function sair() {
    try {
      await api('auth/sair', { metodo: 'POST' })
    } finally {
      usuario.value = null
    }
  }

  function atualizar(resumo) {
    usuario.value = resumo
  }

  return { usuario, carregado, carregar, entrar, cadastrar, sair, atualizar }
}

// Destino depois de entrar: o cadastro guiado, se ainda não terminou (RF04), ou a página pedida
export function destinoDepoisDoLogin(resumo, volta) {
  if (resumo?.termos_pendentes) return '/boas-vindas'
  if (resumo && !resumo.onboarding.concluido) return '/cadastro-guiado'
  return volta && volta.startsWith('/') && !volta.startsWith('//') ? volta : '/'
}
