<!-- Etapa 6 · Família: com quem divide, percentual, conta familiar, cartão do casal e o que é dividido -->
<script setup>
import { computed } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import EscolhaChips from './EscolhaChips.vue'
import { brl } from 'src/utils/previa'

const r = defineModel({ type: Object, required: true })
const props = defineProps({
  contas: { type: Array, default: () => [] },
  cartoes: { type: Array, default: () => [] },
  itens: { type: Array, default: () => [] }, // contas fixas e parcelas
})
const opcoesContas = computed(() => [...props.contas.map((c) => [c.id, c.nome]), [null, 'Ainda não tenho']])
const opcoesCartoes = computed(() => [...props.cartoes.map((c) => [c.id, c.nome]), [null, 'Não temos']])
const minhaParte = (valor) => (Number(valor) || 0) * (1 - (Number(r.value.percentual_outro) || 0) / 100)

function alternar(id, marcado) {
  const lista = r.value.divididos
  if (marcado && !lista.includes(id)) lista.push(id)
  if (!marcado) r.value.divididos = lista.filter((x) => x !== id)
}
</script>

<template>
  <div class="sf-dica">
    <SuriMascote expressao="feliz" :tamanho="48" />
    <p>
      Se você divide as contas da casa, o que você
      <b>transferir para a conta familiar já sai do seu disponível</b>
      na hora, mesmo antes de o boleto ser pago.
    </p>
  </div>
  <q-toggle v-model="r.divide" label="Divido contas com alguém" data-testid="divide" />
  <template v-if="r.divide">
    <div class="row q-col-gutter-sm">
      <div class="col-7"><q-input v-model="r.com_quem" outlined dense label="Com quem" maxlength="60" /></div>
      <div class="col-5">
        <q-input
          v-model.number="r.percentual_outro"
          outlined
          dense
          type="number"
          min="0"
          max="100"
          :label="`Parte de ${r.com_quem || 'outra pessoa'} (%)`"
        />
      </div>
    </div>
    <div class="sf-rotulo">Conta familiar</div>
    <EscolhaChips
      v-model="r.conta_familiar_id"
      :opcoes="opcoesContas"
      cor="secondary"
      rotulo="Conta familiar"
      denso
    />
    <div class="sf-rotulo">Cartão do casal</div>
    <EscolhaChips
      v-model="r.cartao_casal_id"
      :opcoes="opcoesCartoes"
      cor="secondary"
      rotulo="Cartão do casal"
      denso
    />
    <div class="sf-rotulo">Contas fixas e parcelas divididas</div>
    <div v-if="!itens.length" class="sf-muted" style="font-size: 13px">
      Cadastre contas fixas na etapa anterior para escolher quais são divididas.
    </div>
    <div class="column" style="gap: 4px">
      <q-checkbox
        v-for="item in itens"
        :key="item.id"
        dense
        :model-value="r.divididos.includes(item.id)"
        :label="`${item.descricao}${item.valor ? ' · sua parte ' + brl(minhaParte(item.valor)) : ''}`"
        @update:model-value="(v) => alternar(item.id, v)"
      />
    </div>
  </template>
</template>
