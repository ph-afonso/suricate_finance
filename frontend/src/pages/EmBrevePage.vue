<script setup>
import SuriMascote from 'components/SuriMascote.vue'

defineProps({
  titulo: { type: String, required: true },
  modulo: { type: String, required: true },
})
</script>

<template>
  <q-page padding class="flex flex-center">
    <div class="column items-center q-gutter-sm text-center" style="max-width: 420px">
      <SuriMascote expressao="vigia" :tamanho="72" />
      <h1 style="font-size: 22px">{{ titulo }}</h1>
      <p class="sf-muted q-mb-none">
        Esta tela chega no <b>{{ modulo }}</b
        >. O desenho dela já está aprovado nos protótipos.
      </p>
      <q-btn flat color="primary" no-caps label="Voltar para o início" to="/" />
    </div>
  </q-page>
</template>
