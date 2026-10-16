<script setup>
import SuriMascote from 'components/SuriMascote.vue'
</script>

<template>
  <div class="fullscreen flex flex-center text-center q-pa-md">
    <div class="column items-center q-gutter-sm">
      <SuriMascote expressao="preocupado" :tamanho="80" />
      <h1 style="font-size: 24px">Página não encontrada</h1>
      <p class="sf-muted q-mb-none">O Suri procurou por toda a toca e não achou este endereço.</p>
      <q-btn unelevated color="primary" label="Ir para o início" to="/" />
    </div>
  </div>
</template>
