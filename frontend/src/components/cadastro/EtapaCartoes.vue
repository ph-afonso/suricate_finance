<!-- Etapa 4 · Cartões: limite, fechamento e vencimento; o Suri explica em que fatura cai uma compra -->
<script setup>
import { computed, reactive } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { brl, dicaDoCartao } from 'src/utils/previa'

const r = defineModel({ type: Object, required: true })
const props = defineProps({ diaSalario: { type: Number, default: null } })
const novo = reactive({ nome: '', limite: null, fechamento: null, vencimento: null })
const dica = computed(() => dicaDoCartao(r.value.cartoes[0], props.diaSalario))

function adicionar() {
  if (!novo.nome.trim() || !novo.fechamento || !novo.vencimento) return
  r.value.cartoes.push({
    id: crypto.randomUUID(),
    ...novo,
    nome: novo.nome.trim(),
    limite: Number(novo.limite) || 0,
  })
  Object.assign(novo, { nome: '', limite: null, fechamento: null, vencimento: null })
}
</script>

<template>
  <div class="sf-dica">
    <SuriMascote :tamanho="48" />
    <p>{{ dica || 'Cadastre seus cartões com o dia em que a fatura fecha e o dia em que vence.' }}</p>
  </div>
  <div v-for="(c, i) in r.cartoes" :key="c.id" class="sf-item">
    <q-avatar size="34px" color="primary" text-color="white" icon="sym_r_credit_card" />
    <div class="col">
      <div>{{ c.nome }}</div>
      <div class="sf-muted" style="font-size: 12px">
        fecha dia {{ c.fechamento }} · vence dia {{ c.vencimento }}
      </div>
    </div>
    <span class="sf-muted sf-num" style="font-size: 13px">limite {{ brl(c.limite) }}</span>
    <q-btn flat round dense icon="sym_r_delete" aria-label="Remover cartão" @click="r.cartoes.splice(i, 1)" />
  </div>
  <div class="sf-novo">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-6">
        <q-input v-model="novo.nome" outlined dense label="Cartão" placeholder="Ex.: Leroy Pay" />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          v-model.number="novo.limite"
          outlined
          dense
          type="number"
          min="0"
          label="Limite"
          prefix="R$"
        />
      </div>
      <div class="col-6">
        <q-input
          v-model.number="novo.fechamento"
          outlined
          dense
          type="number"
          min="1"
          max="31"
          label="Fecha dia"
        />
      </div>
      <div class="col-6">
        <q-input
          v-model.number="novo.vencimento"
          outlined
          dense
          type="number"
          min="1"
          max="31"
          label="Vence dia"
        />
      </div>
    </div>
    <q-btn flat color="primary" icon="sym_r_add" no-caps label="Adicionar cartão" @click="adicionar" />
  </div>
</template>
