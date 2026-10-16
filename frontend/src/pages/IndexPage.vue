<!-- Página inicial (CT06): saudação, convite para continuar o cadastro guiado (RF04) e a saúde do sistema.
     A tela do período (T04) chega no M3. -->
<script setup>
import { computed, onMounted } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { useApi } from 'src/composables/useApi'
import { useSessao } from 'src/composables/useSessao'

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

const { usuario } = useSessao()
const nome = computed(() => usuario.value?.apelido || usuario.value?.nome?.split(' ')[0])
const cadastro = computed(() => usuario.value?.onboarding)
</script>

<template>
  <q-page padding>
    <div class="column no-wrap q-gutter-md" style="max-width: 640px; margin: 0 auto">
      <div class="sf-dica">
        <SuriMascote :expressao="tudoOk ? 'feliz' : erro || dados ? 'preocupado' : 'vigia'" :tamanho="56" />
        <div>
          <h1 style="font-size: 22px">{{ nome ? `Oi, ${nome}!` : 'Suricate Finance' }}</h1>
          <p class="q-mb-none q-mt-xs">
            A tela do seu período chega no próximo módulo. Por enquanto, eu fico de vigia no sistema e guardo
            tudo o que você cadastrou.
          </p>
        </div>
      </div>

      <q-card v-if="cadastro && !cadastro.concluido" class="sf-card" data-testid="continuar-cadastro">
        <q-card-section class="row items-center no-wrap" style="gap: 12px">
          <q-circular-progress
            :value="(cadastro.etapa_atual / 7) * 100"
            size="48px"
            :thickness="0.18"
            color="primary"
            track-color="grey-3"
            show-value
            class="sf-num"
            >{{ cadastro.etapa_atual }}/7</q-circular-progress
          >
          <div class="col">
            <div class="sf-titulo" style="font-size: 16px">
              Continue seu cadastro ({{ cadastro.etapa_atual }} de 7)
            </div>
            <div class="sf-muted" style="font-size: 13px">
              Faltam poucas etapas para o seu primeiro período.
            </div>
          </div>
          <q-btn unelevated color="primary" label="Continuar" to="/cadastro-guiado" />
        </q-card-section>
      </q-card>

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
