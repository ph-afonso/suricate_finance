<!-- Página Novidades (RF49, CT16, CT17) -->
<script setup>
import { onMounted } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { useNovidades } from 'src/composables/useNovidades'

const { versoes, emPreparacao, marcarComoVista } = useNovidades()
onMounted(marcarComoVista)
</script>

<template>
  <q-page padding>
    <div class="column no-wrap q-gutter-md" style="max-width: 720px; margin: 0 auto">
      <h1 style="font-size: 24px">Novidades</h1>

      <div v-if="!versoes.length" class="sf-dica">
        <SuriMascote expressao="vigia" :tamanho="44" />
        <p class="q-mb-none">
          Ainda não há versão publicada. A primeira sai em breve, e o que vem nela está logo abaixo.
        </p>
      </div>

      <q-card v-for="v in versoes" :key="v.versao" class="sf-card" data-testid="versao">
        <q-card-section class="row items-baseline q-gutter-x-sm">
          <span class="sf-titulo" style="font-size: 18px">Versão {{ v.versao }}</span>
          <span class="sf-muted sf-num">{{ v.data }}</span>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <ul class="q-my-none q-pl-md">
            <li v-for="(item, i) in v.itens" :key="i" class="q-mb-xs">{{ item }}</li>
          </ul>
        </q-card-section>
      </q-card>

      <q-card v-if="emPreparacao.length" flat class="sf-card" style="border-style: dashed">
        <q-card-section class="sf-titulo" style="font-size: 16px">Chegando na próxima versão</q-card-section>
        <q-card-section class="q-pt-none">
          <ul class="q-my-none q-pl-md">
            <li v-for="(item, i) in emPreparacao" :key="i" class="q-mb-xs">{{ item }}</li>
          </ul>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
