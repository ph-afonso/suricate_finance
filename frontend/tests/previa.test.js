import { describe, expect, it } from 'vitest'
import { calcularPrevia, dicaDoCartao, faixaDeParcelas, periodoAtual } from 'src/utils/previa'

const HOJE = new Date(2026, 9, 16) // 16/10/2026

const RESPOSTAS = {
  renda: { dia: 15, valor_medio: 5200, outras: [{ id: 'a', valor: 800 }] },
  contas: {
    contas: [
      { id: 'c1', tipo: 'corrente', saldo: 1000 },
      { id: 'c2', tipo: 'familiar', saldo: 3000 },
    ],
  },
  contas_fixas: {
    fixas: [
      { id: 'aluguel', valor: 2000 },
      { id: 'luz', valor: 200 },
    ],
    parcelas: [
      { id: 'carro', valor: 900, total: 48, pagas: 20 },
      { id: 'quitada', valor: 500, total: 10, pagas: 10 },
    ],
  },
  familia: { divide: true, percentual_outro: 40, divididos: ['aluguel'] },
  objetivos: { limite_cartao: 1000, limite_debito: 300 },
}

describe('CT31 · prévia do período', () => {
  it('soma as entradas e desconta a sua parte das fixas, as parcelas abertas e os limites', () => {
    const p = calcularPrevia(RESPOSTAS, HOJE)
    expect(p.entradas).toBe(6000)
    // aluguel dividido: 60% de 2000 = 1200; luz 200; carro 900; a parcela quitada não entra
    expect(p.minhasFixas).toBe(2300)
    expect(p.limites).toBe(1300)
    expect(p.sobra).toBe(2400)
    expect(p.saldoPessoal).toBe(1000) // a conta familiar não entra no disponível
  })

  it('sem divisão, as contas fixas entram inteiras', () => {
    const p = calcularPrevia({ ...RESPOSTAS, familia: { divide: false, divididos: ['aluguel'] } }, HOJE)
    expect(p.minhasFixas).toBe(3100)
  })

  it('com respostas vazias, tudo é zero e não há período', () => {
    expect(calcularPrevia({}, HOJE)).toMatchObject({ entradas: 0, sobra: 0, periodo: null })
  })
})

describe('CT31 · nome e datas do período (RN01, RN02)', () => {
  it('leva o nome do mês em que começa, com as datas completas', () => {
    expect(periodoAtual(15, HOJE)).toEqual({ nome: 'Outubro', inicio: '15/10/2026', fim: '14/11/2026' })
  })

  it('antes do dia do salário, ainda é o período que começou no mês anterior', () => {
    expect(periodoAtual(20, HOJE)).toEqual({ nome: 'Setembro', inicio: '20/09/2026', fim: '19/10/2026' })
  })

  it('dia 1 vira o mês do calendário, e dia 31 cai no último dia dos meses curtos', () => {
    expect(periodoAtual(1, HOJE)).toEqual({ nome: 'Outubro', inicio: '01/10/2026', fim: '31/10/2026' })
    expect(periodoAtual(31, new Date(2026, 1, 28))).toEqual({
      nome: 'Fevereiro',
      inicio: '28/02/2026',
      fim: '30/03/2026',
    })
  })
})

describe('textos do Suri', () => {
  it('faixa das parcelas com total e já pagas (PR #98)', () => {
    expect(faixaDeParcelas(48, 20)).toBe('Lançamentos de 21/48 a 48/48 · faltam 28')
    expect(faixaDeParcelas(10, 10)).toBe('Todas as 10 parcelas já foram pagas')
  })

  it('linha do tempo do cartão', () => {
    const dica = dicaDoCartao({ nome: 'Leroy Pay', fechamento: 1, vencimento: 10 }, 15)
    expect(dica).toContain('a partir do dia 1')
    expect(dica).toContain('vence no dia 10 do mês seguinte')
    expect(dica).toContain('salário do dia 15')
  })
})
