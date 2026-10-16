<!-- Etapa 7 · Objetivos: metas na ordem de prioridade e quanto gastar por período no cartão e no débito/Pix -->
<script setup>
import { ref } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { brl } from 'src/utils/previa'

const r = defineModel({ type: Object, required: true })
defineProps({ sobra: { type: Number, default: null } })
const SUGERIDAS = ['Reserva de emergência', 'Quitar dívidas', 'Quitar o carro', 'Viagem', 'Aposentadoria']
const outra = ref('')

function alternar(meta) {
  const i = r.value.metas.indexOf(meta)
  if (i >= 0) r.value.metas.splice(i, 1)
  else if (meta.trim()) r.value.metas.push(meta.trim())
  outra.value = ''
}
</script>

<template>
  <div class="sf-dica">
    <SuriMascote :tamanho="48" />
    <p>
      Escolha suas metas <b>na ordem de prioridade</b>. Quitar uma dívida com juros altos costuma render mais
      do que guardar, e eu vou te lembrar disso.
    </p>
  </div>
  <div class="row" style="gap: 4px">
    <q-chip
      v-for="m in [...SUGERIDAS, ...r.metas.filter((x) => !SUGERIDAS.includes(x))]"
      :key="m"
      clickable
      :color="r.metas.includes(m) ? 'primary' : undefined"
      :text-color="r.metas.includes(m) ? 'white' : undefined"
      @click="alternar(m)"
    >
      <span v-if="r.metas.includes(m)" class="sf-num q-mr-xs">{{ r.metas.indexOf(m) + 1 }}.</span>{{ m }}
    </q-chip>
  </div>
  <div class="row no-wrap" style="gap: 8px">
    <q-input
      v-model="outra"
      outlined
      dense
      class="col"
      label="Outra meta"
      maxlength="60"
      @keyup.enter="alternar(outra)"
    />
    <q-btn flat color="primary" icon="sym_r_add" aria-label="Adicionar meta" @click="alternar(outra)" />
  </div>
  <h3 class="sf-titulo" style="font-size: 16px">Quanto quer gastar por período</h3>
  <div class="row q-col-gutter-sm">
    <div class="col-6">
      <q-input v-model.number="r.limite_cartao" outlined type="number" min="0" label="Cartão" prefix="R$" />
    </div>
    <div class="col-6">
      <q-input
        v-model.number="r.limite_debito"
        outlined
        type="number"
        min="0"
        label="Débito e Pix"
        prefix="R$"
      />
    </div>
  </div>
  <div v-if="sobra !== null" class="sf-dica lt-md">
    <p>
      Com o que você cadastrou, sobram cerca de <b class="sf-num">{{ brl(sobra) }}</b> por período para as
      metas.
    </p>
  </div>
</template>
