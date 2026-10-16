<!-- Etapa 2 · Sua renda: dia e valor médio em campos separados, fim de semana com "Não sei",
     dias de atraso só quando atrasa, e outras entradas fixas (RN01–RN05) -->
<script setup>
import { computed, reactive } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import EscolhaChips from './EscolhaChips.vue'
import { brl, periodoAtual } from 'src/utils/previa'

const r = defineModel({ type: Object, required: true })
const FIM_DE_SEMANA = [
  ['antecipa', 'Antecipa'],
  ['adia', 'Adia'],
  ['nao_muda', 'Não muda'],
  ['nao_sei', 'Não sei'],
]
const nova = reactive({ descricao: '', dia: null, valor: null })
const periodo = computed(() => periodoAtual(r.value.dia))

function adicionar() {
  if (!nova.descricao || !nova.dia) return
  r.value.outras.push({ id: crypto.randomUUID(), ...nova, valor: Number(nova.valor) || 0 })
  Object.assign(nova, { descricao: '', dia: null, valor: null })
}
</script>

<template>
  <div class="sf-dica">
    <SuriMascote :tamanho="48" />
    <p>
      Seu período começa quando o salário entra, e não no dia 1.
      <template v-if="periodo">
        Com o dia {{ r.dia }}, o atual é <b>{{ periodo.nome }} · {{ periodo.inicio }} a {{ periodo.fim }}</b
        >.
      </template>
    </p>
  </div>
  <div class="row q-col-gutter-sm">
    <div class="col-4">
      <q-input v-model.number="r.dia" outlined type="number" min="1" max="31" label="Dia do salário" />
    </div>
    <div class="col-8">
      <q-input
        v-model.number="r.valor_medio"
        outlined
        type="number"
        min="0"
        label="Valor médio"
        prefix="R$"
      />
    </div>
  </div>
  <div class="sf-rotulo">Quando o dia {{ r.dia || 'do salário' }} cai no fim de semana ou feriado</div>
  <EscolhaChips v-model="r.fim_de_semana" :opcoes="FIM_DE_SEMANA" rotulo="Fim de semana ou feriado" />
  <div v-if="r.fim_de_semana === 'nao_sei'" class="sf-muted" style="font-size: 13px">
    Sem problema: vou considerar que não muda, e você troca depois em Configurações.
  </div>
  <q-toggle v-model="r.atrasa" label="O salário costuma atrasar" data-testid="atrasa" />
  <q-input
    v-if="r.atrasa"
    v-model.number="r.dias_atraso"
    outlined
    dense
    type="number"
    min="1"
    max="31"
    label="Quantos dias, no máximo?"
    style="max-width: 220px"
    data-testid="dias-atraso"
  />

  <h3 class="sf-titulo" style="font-size: 16px">Outras entradas fixas</h3>
  <div v-for="(e, i) in r.outras" :key="e.id" class="sf-item">
    <q-icon name="sym_r_south_west" color="positive" />
    <div class="col">
      <div>{{ e.descricao }}</div>
      <div class="sf-muted" style="font-size: 12px">todo dia {{ e.dia }}</div>
    </div>
    <b class="sf-num">{{ brl(e.valor) }}</b>
    <q-btn flat round dense icon="sym_r_delete" aria-label="Remover entrada" @click="r.outras.splice(i, 1)" />
  </div>
  <div class="sf-novo">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-6">
        <q-input
          v-model="nova.descricao"
          outlined
          dense
          label="Descrição"
          placeholder="Ex.: Aluguel recebido"
        />
      </div>
      <div class="col-4 col-sm-2">
        <q-input v-model.number="nova.dia" outlined dense type="number" min="1" max="31" label="Dia" />
      </div>
      <div class="col-8 col-sm-4">
        <q-input v-model.number="nova.valor" outlined dense type="number" min="0" label="Valor" prefix="R$" />
      </div>
    </div>
    <q-btn flat color="primary" icon="sym_r_add" no-caps label="Adicionar entrada" @click="adicionar" />
  </div>
</template>
