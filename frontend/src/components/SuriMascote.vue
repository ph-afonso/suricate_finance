<!-- O Suri, desenho provisório do M0, com as 4 expressões do guia visual -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  expressao: { type: String, default: 'vigia' },
  tamanho: { type: Number, default: 64 },
})

const pelo = '#C98E5A'
const barriga = '#EED3B0'
const escuro = '#3B2A1E'
const comemorando = computed(() => props.expressao === 'comemorando')
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho * 1.33"
    viewBox="0 0 120 160"
    role="img"
    aria-label="Suri, o suricato"
  >
    <ellipse cx="60" cy="150" rx="30" ry="6" :fill="escuro" opacity=".15" />
    <path d="M86 140 q22 -6 18 -34" :stroke="pelo" stroke-width="7" fill="none" stroke-linecap="round" />
    <ellipse cx="60" cy="112" rx="30" ry="40" :fill="pelo" />
    <ellipse cx="60" cy="118" rx="18" ry="30" :fill="barriga" />
    <path
      v-if="comemorando"
      d="M36 96 L18 62 M84 96 L102 62"
      :stroke="pelo"
      stroke-width="9"
      stroke-linecap="round"
    />
    <path
      v-else
      d="M40 100 q14 10 22 0 M80 100 q-14 10 -22 0"
      :stroke="pelo"
      stroke-width="8"
      fill="none"
      stroke-linecap="round"
    />
    <ellipse cx="60" cy="52" rx="25" ry="23" :fill="pelo" />
    <circle cx="37" cy="40" r="6" :fill="pelo" />
    <circle cx="83" cy="40" r="6" :fill="pelo" />
    <circle cx="37" cy="40" r="3" :fill="escuro" />
    <circle cx="83" cy="40" r="3" :fill="escuro" />
    <ellipse cx="49" cy="50" rx="7.5" ry="8.5" :fill="escuro" />
    <ellipse cx="71" cy="50" rx="7.5" ry="8.5" :fill="escuro" />
    <circle cx="50" cy="49" r="3.4" fill="#fff" />
    <circle cx="70" cy="49" r="3.4" fill="#fff" />
    <ellipse cx="60" cy="60" rx="9" ry="7" :fill="barriga" />
    <ellipse cx="60" cy="57.5" rx="3.6" ry="2.6" :fill="escuro" />
    <path
      v-if="expressao === 'feliz'"
      d="M53 64 q7 8 14 0"
      :stroke="escuro"
      stroke-width="2.4"
      fill="none"
      stroke-linecap="round"
    />
    <g v-else-if="expressao === 'preocupado'">
      <path d="M54 68 q6 -5 12 0" :stroke="escuro" stroke-width="2.2" fill="none" stroke-linecap="round" />
      <path d="M44 40 l9 4 M76 40 l-9 4" :stroke="escuro" stroke-width="2" stroke-linecap="round" />
    </g>
    <path v-else-if="comemorando" d="M52 63 q8 10 16 0 z" :fill="escuro" />
    <path v-else d="M55 66 q5 3 10 0" :stroke="escuro" stroke-width="2" fill="none" stroke-linecap="round" />
  </svg>
</template>
