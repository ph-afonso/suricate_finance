<!-- Página inicial do M1 (CT06): prova que front, API e banco estão ligados neste ambiente -->
<script setup>
import { computed, onMounted } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { useApi } from 'src/composables/useApi'

const { dados, erro, carregando, carregar } = useApi('health')
onMounted(carregar)

const NOMES = {
  production: 'Produção',
  staging: 'Pré-produção',
  development: 'Desenvolvimento',
  test: 'Teste',
}
const tudoOk = computed(() => dados.value?.status === 'ok')
const versaoFront = process.env.APP_VERSION
</script>

<template>
  <q-page padding>
    <div class="column no-wrap q-gutter-md" style="max-width: 640px; margin: 0 auto">
      <div class="sf-dica">
        <SuriMascote :expressao="tudoOk ? 'feliz' : erro || dados ? 'preocupado' : 'vigia'" :tamanho="56" />
        <div>
          <h1 style="font-size: 22px">Suricate Finance</h1>
          <p class="q-mb-none q-mt-xs">
            A fundação está de pé. As telas do seu período chegam nos próximos módulos; por enquanto, eu fico
            de vigia no sistema.
          </p>
        </div>
      </div>

      <q-card class="sf-card" data-testid="saude">
        <q-card-section class="row items-center">
          <div class="sf-titulo" style="font-size: 18px">Saúde do sistema</div>
          <q-space />
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="sym_r_refresh"
            label="Atualizar"
            @click="carregar"
          />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="carregando && !dados" class="column q-gutter-sm">
          <q-skeleton type="text" />
          <q-skeleton type="text" />
          <q-skeleton type="text" />
        </q-card-section>
        <q-card-section v-else-if="erro" class="text-negative">{{ erro }}</q-card-section>
        <q-list v-else-if="dados">
          <q-item>
            <q-item-section>Ambiente</q-item-section>
            <q-item-section side data-testid="ambiente">{{
              NOMES[dados.ambiente] || dados.ambiente
            }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Versão da API</q-item-section>
            <q-item-section side class="sf-num" data-testid="versao">{{ dados.versao }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Versão do app</q-item-section>
            <q-item-section side class="sf-num">{{ versaoFront }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Banco de dados</q-item-section>
            <q-item-section side>
              <q-badge
                :color="dados.banco === 'ok' ? 'positive' : 'negative'"
                :label="`banco: ${dados.banco}`"
                data-testid="banco"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <div class="row q-gutter-sm">
        <q-btn outline color="primary" icon="sym_r_monitor_heart" label="Status dos ambientes" to="/status" />
        <q-btn outline color="primary" icon="sym_r_campaign" label="Novidades" to="/novidades" />
      </div>
    </div>
  </q-page>
</template>
