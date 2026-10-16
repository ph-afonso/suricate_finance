// Prévia do período no cadastro guiado (T03, CT31): a fórmula do protótipo aprovado no M0.
// Entradas − sua parte das contas fixas e parcelas − limites de cartão e débito/Pix = sobra estimada.
// O ajuste de fim de semana e feriado (RN03) e o motor de períodos chegam no M3.

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const num = (v) => Number(v) || 0
const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate()
const inicioNoMes = (ano, mes, dia) => new Date(ano, mes, Math.min(dia, diasNoMes(ano, mes)))
const formatar = (d) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

// RN01 e RN02: o período começa no dia do salário e leva o nome do mês em que começa
export function periodoAtual(dia, hoje = new Date()) {
  if (!dia) return null
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const hojeSemHora = new Date(ano, mes, hoje.getDate())
  let inicio = inicioNoMes(ano, mes, dia)
  if (hojeSemHora < inicio) inicio = inicioNoMes(ano, mes - 1, dia)
  const proximo = inicioNoMes(inicio.getFullYear(), inicio.getMonth() + 1, dia)
  const fim = new Date(proximo.getFullYear(), proximo.getMonth(), proximo.getDate() - 1)
  return { nome: MESES[inicio.getMonth()], inicio: formatar(inicio), fim: formatar(fim) }
}

export function calcularPrevia(respostas, hoje = new Date()) {
  const renda = respostas.renda || {}
  const fixas = respostas.contas_fixas || {}
  const familia = respostas.familia || {}
  const objetivos = respostas.objetivos || {}

  const percentualOutro = familia.divide ? num(familia.percentual_outro) : 0
  const divididos = new Set(familia.divide ? familia.divididos || [] : [])
  const minhaParte = (item) => num(item.valor) * (divididos.has(item.id) ? (100 - percentualOutro) / 100 : 1)
  const parcelasAbertas = (fixas.parcelas || []).filter((p) => num(p.pagas) < num(p.total))

  const entradas = num(renda.valor_medio) + (renda.outras || []).reduce((s, e) => s + num(e.valor), 0)
  const minhasFixas = [...(fixas.fixas || []), ...parcelasAbertas].reduce((s, x) => s + minhaParte(x), 0)
  const limites = num(objetivos.limite_cartao) + num(objetivos.limite_debito)
  const contas = respostas.contas?.contas || []

  return {
    entradas,
    minhasFixas,
    limites,
    sobra: entradas - minhasFixas - limites,
    saldoPessoal: contas.filter((c) => c.tipo !== 'familiar').reduce((s, c) => s + num(c.saldo), 0),
    periodo: periodoAtual(renda.dia, hoje),
  }
}

// "Lançamentos de 21/48 a 48/48 · faltam 28" (decisão do PR #98)
export function faixaDeParcelas(total, pagas) {
  const t = num(total)
  const p = Math.min(t, num(pagas))
  if (!t) return ''
  if (p === t) return `Todas as ${t} parcelas já foram pagas`
  return `Lançamentos de ${p + 1}/${t} a ${t}/${t} · faltam ${t - p}`
}

// Linha do tempo do cartão: em que fatura cai uma compra (etapa Cartões)
export function dicaDoCartao(cartao, diaSalario) {
  if (!cartao?.fechamento || !cartao?.vencimento) return ''
  const fecha = num(cartao.fechamento)
  const vence = num(cartao.vencimento)
  const mesmoMes = vence > fecha
  return (
    `Compras no ${cartao.nome} a partir do dia ${fecha} vão para a fatura que vence no dia ${vence} ` +
    `${mesmoMes ? 'do mês seguinte' : 'de dois meses depois'}` +
    (diaSalario ? `, paga com o salário do dia ${diaSalario}.` : '.') +
    ' Suricato não esquece!'
  )
}

export const brl = (v) => num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
