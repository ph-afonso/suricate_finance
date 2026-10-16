import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { Quasar } from 'quasar'
import EtapaBoasVindas from 'src/components/cadastro/EtapaBoasVindas.vue'
import EtapaRenda from 'src/components/cadastro/EtapaRenda.vue'
import EtapaFamilia from 'src/components/cadastro/EtapaFamilia.vue'
import EtapaContasFixas from 'src/components/cadastro/EtapaContasFixas.vue'

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

function montar(componente, modelValue, props = {}) {
  return mount(componente, {
    props: { modelValue, 'onUpdate:modelValue': () => {}, ...props },
    global: { plugins: [Quasar] },
    attachTo: document.body,
  })
}

describe('CT32 · formulários do cadastro guiado', () => {
  it('"Outros" abre um campo para digitar o objetivo', async () => {
    const r = { apelido: 'Phe', objetivo: null, objetivo_outro: '' }
    const w = montar(EtapaBoasVindas, r)
    expect(w.find('[data-testid="objetivo-outro"]').exists()).toBe(false)
    await w.findAll('[role="radio"]').at(-1).trigger('click')
    expect(r.objetivo).toBe('outro')
    await nextTick()
    expect(w.find('[data-testid="objetivo-outro"]').exists()).toBe(true)
  })

  it('fim de semana tem "Não sei" e os dias de atraso só aparecem quando atrasa', async () => {
    const r = {
      dia: 15,
      valor_medio: 5200,
      fim_de_semana: null,
      atrasa: false,
      dias_atraso: null,
      outras: [],
    }
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 16))
    const w = montar(EtapaRenda, r)
    expect(w.text()).toContain('Não sei')
    expect(w.text()).toContain('Outubro')
    expect(w.find('[data-testid="dias-atraso"]').exists()).toBe(false)
    r.atrasa = true
    await w.setProps({ modelValue: { ...r } })
    expect(w.find('[data-testid="dias-atraso"]').exists()).toBe(true)
  })

  it('a etapa Família só mostra os detalhes quando a pessoa divide as contas', async () => {
    const r = { divide: false, com_quem: '', percentual_outro: 40, divididos: [] }
    const itens = [{ id: 'aluguel', descricao: 'Aluguel', valor: 2000 }]
    const w = montar(EtapaFamilia, r, { itens, contas: [{ id: 'c', nome: 'Inter' }] })
    expect(w.text()).not.toContain('Conta familiar')
    await w.setProps({ modelValue: { ...r, divide: true } })
    expect(w.text()).toContain('Conta familiar')
    expect(w.text()).toContain('Ainda não tenho')
    expect(w.text()).toMatch(/Aluguel · sua parte R\$\s1\.200,00/)
  })

  it('contas fixas sugeridas entram com um toque e saem da lista de sugestões', async () => {
    const r = { fixas: [], parcelas: [] }
    const w = montar(EtapaContasFixas, r)
    const aluguel = w.findAll('.q-chip').find((c) => c.text().includes('Aluguel'))
    await aluguel.trigger('click')
    expect(r.fixas[0]).toMatchObject({ descricao: 'Aluguel', dia: 5, nao_pode_atrasar: false })
    expect(r.fixas[0].id).toMatch(/^[0-9a-f-]{36}$/)
  })
})
