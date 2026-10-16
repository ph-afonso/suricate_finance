<!-- Página de status (RF46, CT14, CT15): ambientes, últimos deploys e última pipeline. Pública e sem dados de usuários. -->
<script setup>
import { computed, onMounted } from 'vue'
import { useApi } from 'src/composables/useApi'

const { dados, erro, carregando, carregar } = useApi('status')
onMounted(carregar)

const dataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const tudoNoAr = computed(() => dados.value?.ambientes.length && dados.value.ambientes.every((a) => a.no_ar))

const PIPELINE = {
  success: ['positive', 'passou'],
  failure: ['negative', 'falhou'],
  cancelled: ['grey', 'cancelada'],
}
const pipeline = computed(() => {
  const p = dados.value?.pipeline
  if (!p) return null
  if (p.estado !== 'completed') return { cor: 'info', texto: 'rodando', ...p }
  const [cor, texto] = PIPELINE[p.conclusao] || ['warning', p.conclusao || 'sem resultado']
  return { cor, texto, ...p }
})
</script>

<template>
  <q-page padding>
    <div class="column q-gutter-md" style="max-width: 960px; margin: 0 auto">
      <div class="row items-center">
        <h1 style="font-size: 24px">Status do sistema</h1>
        <q-space />
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="sym_r_refresh"
          label="Atualizar"
          :loading="carregando"
          @click="carregar"
        />
      </div>

      <q-banner v-if="erro" rounded class="bg-negative text-white">{{ erro }}</q-banner>

      <template v-else-if="dados">
        <q-banner
          rounded
          :class="tudoNoAr ? 'bg-positive text-white' : 'bg-warning text-white'"
          data-testid="resumo"
        >
          {{ tudoNoAr ? 'Todos os ambientes estão no ar.' : 'Há ambiente fora do ar ou sem configuração.' }}
          <span class="q-ml-sm" style="opacity: 0.85">Atualizado às {{ dataHora(dados.atualizado_em) }}</span>
        </q-banner>

        <div class="sf-grade">
          <div v-for="a in dados.ambientes" :key="a.nome">
            <q-card class="sf-card" data-testid="ambiente">
              <q-card-section class="row items-center no-wrap">
                <q-icon
                  :name="a.no_ar ? 'sym_r_check_circle' : 'sym_r_error'"
                  :color="a.no_ar ? 'positive' : 'negative'"
                  size="22px"
                  class="q-mr-sm"
                />
                <b>{{ a.nome }}</b>
                <q-space />
                <q-badge
                  :color="a.no_ar ? 'positive' : 'negative'"
                  :label="a.no_ar ? 'no ar' : 'fora do ar'"
                />
              </q-card-section>
              <q-list dense>
                <q-item>
                  <q-item-section class="sf-muted">Versão</q-item-section>
                  <q-item-section side class="sf-num">{{ a.versao || '—' }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section class="sf-muted">Banco</q-item-section>
                  <q-item-section side>{{ a.banco || '—' }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section class="sf-muted">Resposta</q-item-section>
                  <q-item-section side class="sf-num">{{
                    a.tempo_ms != null ? `${a.tempo_ms} ms` : '—'
                  }}</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
          <div v-if="!dados.ambientes.length" class="sf-muted">
            Nenhum ambiente configurado para monitorar.
          </div>
        </div>

        <div class="sf-grade-2">
          <div>
            <q-card class="sf-card">
              <q-card-section class="sf-titulo" style="font-size: 16px">Últimos deploys</q-card-section>
              <q-list v-if="dados.deploys?.length" separator>
                <q-item v-for="d in dados.deploys" :key="d.ambiente">
                  <q-item-section>
                    <q-item-label
                      >{{ d.ambiente }} · <span class="sf-muted">{{ d.ramo }}</span></q-item-label
                    >
                    <q-item-label caption>{{ d.commit || 'sem mensagem' }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="d.estado === 'ready' ? 'positive' : 'warning'" :label="d.estado" />
                    <q-item-label caption class="sf-num">{{ dataHora(d.quando) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-card-section v-else class="sf-muted q-pt-none"
                >Sem acesso aos deploys da Vercel.</q-card-section
              >
            </q-card>
          </div>
          <div>
            <q-card class="sf-card">
              <q-card-section class="sf-titulo" style="font-size: 16px"
                >Última pipeline de testes</q-card-section
              >
              <q-card-section v-if="pipeline" class="q-pt-none column q-gutter-xs">
                <div>
                  <q-badge :color="pipeline.cor" :label="pipeline.texto" />
                  <span class="sf-muted q-ml-sm">{{ pipeline.ramo }}</span>
                </div>
                <div class="sf-muted sf-num">{{ dataHora(pipeline.quando) }}</div>
                <a :href="pipeline.url" target="_blank" rel="noopener" class="text-primary">Ver no GitHub</a>
              </q-card-section>
              <q-card-section v-else class="sf-muted q-pt-none">Ainda não há execução.</q-card-section>
            </q-card>
          </div>
        </div>
      </template>

      <div v-else class="column q-gutter-sm">
        <q-skeleton height="56px" />
        <q-skeleton height="160px" />
      </div>
    </div>
  </q-page>
</template>
