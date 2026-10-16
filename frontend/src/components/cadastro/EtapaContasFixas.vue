<!-- Etapa 5 · Contas fixas (sugeridas ou digitadas) e parcelas em andamento com total e já pagas (PR #98) -->
<script setup>
import { computed, reactive, ref } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { faixaDeParcelas } from 'src/utils/previa'

const r = defineModel({ type: Object, required: true })
const SUGERIDAS = ['Aluguel', 'Condomínio', 'Água', 'Luz', 'Internet', 'Celular', 'Financiamento', 'Seguro']
const sugestoes = computed(() => SUGERIDAS.filter((n) => !r.value.fixas.some((f) => f.descricao === n)))
const outra = ref('')
const parcela = reactive({ descricao: '', valor: null, total: null, pagas: null })

function adicionarFixa(descricao) {
  if (!descricao.trim()) return
  r.value.fixas.push({
    id: crypto.randomUUID(),
    descricao: descricao.trim(),
    dia: 5,
    valor: null,
    nao_pode_atrasar: false,
  })
  outra.value = ''
}

function adicionarParcela() {
  if (!parcela.descricao.trim() || !parcela.total) return
  r.value.parcelas.push({
    id: crypto.randomUUID(),
    descricao: parcela.descricao.trim(),
    valor: Number(parcela.valor) || 0,
    total: Number(parcela.total),
    pagas: Number(parcela.pagas) || 0,
  })
  Object.assign(parcela, { descricao: '', valor: null, total: null, pagas: null })
}
</script>

<template>
  <div class="sf-dica">
    <SuriMascote :tamanho="48" />
    <p>
      Toque nas contas que você paga todo mês e preencha valor e vencimento. Marque as que
      <b>não podem atrasar</b> (multa ou perda de desconto): eu aviso antes.
    </p>
  </div>
  <div class="row" style="gap: 4px">
    <q-chip
      v-for="n in sugestoes"
      :key="n"
      clickable
      outline
      color="primary"
      icon="sym_r_add"
      @click="adicionarFixa(n)"
    >
      {{ n }}
    </q-chip>
  </div>
  <div class="row no-wrap" style="gap: 8px">
    <q-input
      v-model="outra"
      outlined
      dense
      class="col"
      label="Outra conta fixa"
      @keyup.enter="adicionarFixa(outra)"
    />
    <q-btn
      flat
      color="primary"
      icon="sym_r_add"
      aria-label="Adicionar conta fixa"
      @click="adicionarFixa(outra)"
    />
  </div>
  <div v-for="(f, i) in r.fixas" :key="f.id" class="sf-item" style="flex-wrap: wrap">
    <b class="col-12 col-sm" style="min-width: 120px">{{ f.descricao }}</b>
    <q-input
      v-model.number="f.valor"
      outlined
      dense
      type="number"
      min="0"
      label="Valor"
      prefix="R$"
      style="width: 130px"
    />
    <q-input
      v-model.number="f.dia"
      outlined
      dense
      type="number"
      min="1"
      max="31"
      label="Dia"
      style="width: 72px"
    />
    <q-checkbox v-model="f.nao_pode_atrasar" dense label="Não pode atrasar" />
    <q-btn
      flat
      round
      dense
      icon="sym_r_delete"
      aria-label="Remover conta fixa"
      @click="r.fixas.splice(i, 1)"
    />
  </div>

  <h3 class="sf-titulo" style="font-size: 16px">Parcelas e financiamentos em andamento</h3>
  <div v-for="(p, i) in r.parcelas" :key="p.id" class="sf-item">
    <q-icon name="sym_r_event_repeat" color="primary" />
    <div class="col">
      <div>{{ p.descricao }} · R$ {{ p.valor }}</div>
      <div class="sf-muted sf-num" style="font-size: 12px">{{ faixaDeParcelas(p.total, p.pagas) }}</div>
    </div>
    <q-btn
      flat
      round
      dense
      icon="sym_r_delete"
      aria-label="Remover parcela"
      @click="r.parcelas.splice(i, 1)"
    />
  </div>
  <div class="sf-novo">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-6">
        <q-input v-model="parcela.descricao" outlined dense label="Descrição" placeholder="Ex.: Carro" />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          v-model.number="parcela.valor"
          outlined
          dense
          type="number"
          min="0"
          label="Valor da parcela"
          prefix="R$"
        />
      </div>
      <div class="col-6">
        <q-input v-model.number="parcela.total" outlined dense type="number" min="1" label="Quantas eram" />
      </div>
      <div class="col-6">
        <q-input
          v-model.number="parcela.pagas"
          outlined
          dense
          type="number"
          min="0"
          label="Quantas já paguei"
        />
      </div>
    </div>
    <div v-if="parcela.total" class="sf-muted sf-num" style="font-size: 13px">
      {{ faixaDeParcelas(parcela.total, parcela.pagas) }}
    </div>
    <q-btn
      flat
      color="primary"
      icon="sym_r_add"
      no-caps
      label="Adicionar parcela"
      @click="adicionarParcela"
    />
  </div>
</template>
