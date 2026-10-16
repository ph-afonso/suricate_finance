<!-- Etapa 3 · Contas bancárias: nome, banco, tipo e saldo de hoje. A conta familiar não entra no disponível -->
<script setup>
import { reactive } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import EscolhaChips from './EscolhaChips.vue'
import { brl } from 'src/utils/previa'

const r = defineModel({ type: Object, required: true })
const BANCOS = ['Nubank', 'Inter', 'Itaú', 'Bradesco', 'Caixa', 'Santander', 'Banco do Brasil', 'C6'].map(
  (b) => [b, b],
)
const TIPOS = [
  ['corrente', 'Conta corrente'],
  ['poupanca', 'Poupança'],
  ['investimentos', 'Investimentos'],
  ['vr_va', 'VR/VA'],
  ['dinheiro', 'Dinheiro'],
  ['familiar', 'Familiar'],
]
const NOME_TIPO = Object.fromEntries(TIPOS)
const nova = reactive({ nome: '', banco: 'Nubank', outroBanco: '', tipo: 'corrente', saldo: null })

function adicionar() {
  const banco = nova.banco === 'outro' ? nova.outroBanco.trim() : nova.banco
  if (!nova.nome.trim() || !banco) return
  r.value.contas.push({
    id: crypto.randomUUID(),
    nome: nova.nome.trim(),
    banco,
    tipo: nova.tipo,
    saldo: Number(nova.saldo) || 0,
  })
  Object.assign(nova, { nome: '', outroBanco: '', saldo: null })
}
</script>

<template>
  <div class="sf-dica">
    <SuriMascote :tamanho="48" />
    <p>
      Cadastre onde seu dinheiro está hoje. A <b>conta familiar</b> guarda o dinheiro da casa, então ela não
      entra no seu disponível.
    </p>
  </div>
  <div v-for="(c, i) in r.contas" :key="c.id" class="sf-item">
    <q-avatar
      size="34px"
      :color="c.tipo === 'familiar' ? 'secondary' : 'primary'"
      text-color="white"
      icon="sym_r_account_balance"
    />
    <div class="col">
      <div>{{ c.nome }}</div>
      <div class="sf-muted" style="font-size: 12px">{{ c.banco }} · {{ NOME_TIPO[c.tipo] }}</div>
    </div>
    <b class="sf-num">{{ brl(c.saldo) }}</b>
    <q-btn flat round dense icon="sym_r_delete" aria-label="Remover conta" @click="r.contas.splice(i, 1)" />
  </div>
  <div class="sf-novo">
    <div class="row q-col-gutter-sm">
      <div class="col-7">
        <q-input v-model="nova.nome" outlined dense label="Nome da conta" placeholder="Ex.: Conta Familiar" />
      </div>
      <div class="col-5">
        <q-input v-model.number="nova.saldo" outlined dense type="number" label="Saldo hoje" prefix="R$" />
      </div>
    </div>
    <EscolhaChips v-model="nova.banco" :opcoes="[...BANCOS, ['outro', 'Outro']]" rotulo="Banco" denso />
    <q-input v-if="nova.banco === 'outro'" v-model="nova.outroBanco" outlined dense label="Qual banco?" />
    <EscolhaChips v-model="nova.tipo" :opcoes="TIPOS" cor="secondary" rotulo="Tipo de conta" denso />
    <q-btn flat color="primary" icon="sym_r_add" no-caps label="Adicionar conta" @click="adicionar" />
  </div>
</template>
