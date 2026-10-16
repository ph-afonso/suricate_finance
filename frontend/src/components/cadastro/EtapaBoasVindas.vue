<!-- Etapa 1 · Boas-vindas: como chamar e o objetivo principal ("Outros" abre campo) -->
<script setup>
import SuriMascote from 'components/SuriMascote.vue'
import EscolhaChips from './EscolhaChips.vue'

const r = defineModel({ type: Object, required: true })
const OBJETIVOS = [
  ['sair_do_vermelho', 'Sair do vermelho'],
  ['juntar_dinheiro', 'Juntar dinheiro'],
  ['quitar_divida', 'Quitar dívida'],
  ['organizar', 'Organizar as contas'],
  ['outro', 'Outros'],
]
</script>

<template>
  <div class="sf-dica">
    <SuriMascote expressao="feliz" :tamanho="52" />
    <p>
      <b>Oi! Eu sou o Suri.</b> Vou ficar de vigia nas suas finanças. Em 7 etapas a gente monta o seu primeiro
      período, e você já sai com tudo cadastrado.
    </p>
  </div>
  <q-input v-model="r.apelido" outlined label="Como posso te chamar?" maxlength="40" data-testid="apelido" />
  <div class="sf-rotulo">O que você mais quer agora?</div>
  <EscolhaChips v-model="r.objetivo" :opcoes="OBJETIVOS" rotulo="Objetivo principal" />
  <q-input
    v-if="r.objetivo === 'outro'"
    v-model="r.objetivo_outro"
    outlined
    dense
    label="Conte com suas palavras"
    maxlength="120"
    data-testid="objetivo-outro"
  />
</template>
