<!-- Opções como chips (formato das respostas do cadastro guiado): um toque escolhe, o escolhido fica colorido -->
<script setup>
const escolhido = defineModel({ type: [String, Number, Boolean, null], default: null })
defineProps({
  opcoes: { type: Array, required: true }, // [[valor, rótulo], ...]
  cor: { type: String, default: 'primary' },
  rotulo: { type: String, required: true }, // nome do grupo, para leitores de tela
  denso: Boolean,
})
</script>

<template>
  <div class="row" style="gap: 4px" role="radiogroup" :aria-label="rotulo">
    <q-chip
      v-for="[valor, texto] in opcoes"
      :key="String(valor)"
      clickable
      :dense="denso"
      role="radio"
      :aria-checked="escolhido === valor"
      :color="escolhido === valor ? cor : undefined"
      :text-color="escolhido === valor ? 'white' : undefined"
      @click="escolhido = valor"
      @keyup.enter="escolhido = valor"
    >
      {{ texto }}
    </q-chip>
  </div>
</template>
