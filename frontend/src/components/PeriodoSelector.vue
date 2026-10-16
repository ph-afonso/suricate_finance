<!-- Seletor de período (RF07). No M1 os períodos são fixos; o motor de períodos chega no M3. -->
<script setup>
import { computed, ref } from 'vue'

const periodos = [
  { nome: 'Setembro', ini: '15/09/2026', fim: '14/10/2026' },
  { nome: 'Outubro', ini: '15/10/2026', fim: '14/11/2026', atual: true },
  { nome: 'Novembro', ini: '15/11/2026', fim: '14/12/2026' },
]
const indice = ref(1)
const periodo = computed(() => periodos[indice.value])
</script>

<template>
  <div class="row items-center no-wrap justify-center" style="gap: 2px; min-width: 0">
    <q-btn
      flat
      round
      dense
      icon="sym_r_chevron_left"
      aria-label="Período anterior"
      :disable="indice === 0"
      @click="indice--"
    />
    <div class="text-center" style="min-width: 0">
      <div class="sf-titulo" style="font-size: 16px; line-height: 1.1">
        {{ periodo.nome }}
        <q-badge v-if="periodo.atual" color="secondary" label="atual" class="q-ml-xs" />
      </div>
      <div class="sf-muted sf-num" style="font-size: 12px">{{ periodo.ini }} a {{ periodo.fim }}</div>
    </div>
    <q-btn
      flat
      round
      dense
      icon="sym_r_chevron_right"
      aria-label="Próximo período"
      :disable="indice === periodos.length - 1"
      @click="indice++"
    />
  </div>
</template>
