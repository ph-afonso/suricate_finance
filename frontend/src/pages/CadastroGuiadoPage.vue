<!-- T03 · Cadastro guiado do Suri (RF03, RF04). Uma etapa por tela no celular; no desktop, etapas à esquerda,
     formulário no centro e a prévia do período à direita, atualizada enquanto a pessoa cadastra.
     Cada "Continuar" grava a etapa na API, que valida e dá a conquista. -->
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import SuriMascote from 'components/SuriMascote.vue'
import EtapaBoasVindas from 'components/cadastro/EtapaBoasVindas.vue'
import EtapaRenda from 'components/cadastro/EtapaRenda.vue'
import EtapaContas from 'components/cadastro/EtapaContas.vue'
import EtapaCartoes from 'components/cadastro/EtapaCartoes.vue'
import EtapaContasFixas from 'components/cadastro/EtapaContasFixas.vue'
import EtapaFamilia from 'components/cadastro/EtapaFamilia.vue'
import EtapaObjetivos from 'components/cadastro/EtapaObjetivos.vue'
import { api, useSessao } from 'src/composables/useSessao'
import { brl, calcularPrevia } from 'src/utils/previa'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { usuario, carregar: recarregarSessao } = useSessao()
const desktop = computed(() => $q.screen.gt.sm)

const COMPONENTES = {
  boas_vindas: EtapaBoasVindas,
  renda: EtapaRenda,
  contas: EtapaContas,
  cartoes: EtapaCartoes,
  contas_fixas: EtapaContasFixas,
  familia: EtapaFamilia,
  objetivos: EtapaObjetivos,
}

function padrao(chave) {
  return {
    boas_vindas: {
      apelido: usuario.value?.apelido || usuario.value?.nome?.split(' ')[0] || '',
      objetivo: null,
      objetivo_outro: '',
    },
    renda: {
      dia: null,
      valor_medio: null,
      fim_de_semana: null,
      atrasa: false,
      dias_atraso: null,
      outras: [],
    },
    contas: { contas: [] },
    cartoes: { cartoes: [] },
    contas_fixas: { fixas: [], parcelas: [] },
    familia: {
      divide: false,
      com_quem: '',
      percentual_outro: 50,
      conta_familiar_id: null,
      cartao_casal_id: null,
      divididos: [],
    },
    objetivos: { metas: [], limite_cartao: null, limite_debito: null },
  }[chave]
}

const etapas = ref([]) // [{chave, titulo, conquista, status}]
const conquistas = ref([])
const respostas = reactive({})
const indice = ref(0)
const fim = computed(() => indice.value >= etapas.value.length)
const atual = computed(() => etapas.value[indice.value])
const carregando = ref(true)
const salvando = ref(false)
const refazendo = computed(() => route.query.refazer === '1')
const previa = computed(() => calcularPrevia(respostas))

function aplicar(visao) {
  etapas.value = visao.etapas.map(({ chave, titulo, conquista, status }) => ({
    chave,
    titulo,
    conquista,
    status,
  }))
  conquistas.value = visao.conquistas
}

onMounted(async () => {
  try {
    const visao = await api('onboarding')
    aplicar(visao)
    for (const e of visao.etapas) respostas[e.chave] = { ...padrao(e.chave), ...(e.respostas || {}) }
    const pedida = visao.etapas.findIndex((e) => e.chave === route.params.etapa)
    indice.value = pedida >= 0 ? pedida : visao.etapa_atual
    marcarNaUrl(indice.value)
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    carregando.value = false
  }
})

// a etapa vai na URL: recarregar a página continua no mesmo lugar
function marcarNaUrl(i) {
  const chave = etapas.value[i]?.chave
  if (chave && route.params.etapa !== chave) router.replace({ params: { etapa: chave }, query: route.query })
}
watch(indice, marcarNaUrl)

// campos que a pessoa deixou em branco viram zero, para a API aceitar
function limpar(chave, dados) {
  const copia = JSON.parse(JSON.stringify(dados))
  if (chave === 'contas_fixas') copia.fixas.forEach((f) => (f.valor = Number(f.valor) || 0))
  if (chave === 'renda' && copia.fim_de_semana === null) copia.fim_de_semana = 'nao_sei'
  return copia
}

async function continuar() {
  const chave = atual.value.chave
  salvando.value = true
  try {
    const antes = conquistas.value.length
    aplicar(
      await api(`onboarding/etapas/${chave}`, { metodo: 'PUT', corpo: limpar(chave, respostas[chave]) }),
    )
    if (conquistas.value.length > antes) {
      $q.notify({
        icon: 'sym_r_emoji_events',
        color: 'secondary',
        message: `Conquista desbloqueada: ${atual.value.conquista}`,
      })
    }
    if (refazendo.value) return router.push({ path: '/configuracoes', query: { aba: 'cadastro' } })
    if (indice.value === etapas.value.length - 1) {
      aplicar(await api('onboarding/concluir', { metodo: 'POST' }))
      await recarregarSessao()
    }
    indice.value++
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    salvando.value = false
  }
}

async function pularEtapa() {
  try {
    aplicar(await api(`onboarding/etapas/${atual.value.chave}/pular`, { metodo: 'POST' }))
    if (indice.value === etapas.value.length - 1) {
      aplicar(await api('onboarding/concluir', { metodo: 'POST' }))
      await recarregarSessao()
    }
    indice.value++
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  }
}

const extras = computed(() => {
  const chave = atual.value?.chave
  if (chave === 'cartoes') return { diaSalario: respostas.renda?.dia || null }
  if (chave === 'familia')
    return {
      contas: respostas.contas?.contas || [],
      cartoes: respostas.cartoes?.cartoes || [],
      itens: [...(respostas.contas_fixas?.fixas || []), ...(respostas.contas_fixas?.parcelas || [])],
    }
  if (chave === 'objetivos') return { sobra: respostas.renda?.valor_medio ? previa.value.sobra : null }
  return {}
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="sf-cadastro" :class="{ 'sf-cadastro--desktop': desktop }">
        <div v-if="carregando" class="flex flex-center" style="min-height: 60vh">
          <q-spinner color="primary" size="40px" />
        </div>
        <template v-else>
          <!-- Etapas e conquistas (desktop) -->
          <aside v-if="desktop" class="sf-cadastro-lado">
            <router-link
              to="/"
              class="row items-center no-wrap q-mb-lg"
              style="gap: 8px; color: inherit; text-decoration: none"
            >
              <SuriMascote :tamanho="28" />
              <b class="sf-titulo" style="font-size: 18px">Suricate</b>
            </router-link>
            <q-list>
              <q-item
                v-for="(e, i) in etapas"
                :key="e.chave"
                clickable
                :active="indice === i"
                active-class="text-primary"
                style="border-radius: 8px"
                @click="indice = i"
              >
                <q-item-section avatar style="min-width: 36px">
                  <q-icon
                    v-if="conquistas.includes(e.conquista)"
                    name="sym_r_check_circle"
                    color="positive"
                  />
                  <q-avatar
                    v-else
                    size="24px"
                    :color="indice === i ? 'primary' : 'grey-4'"
                    :text-color="indice === i ? 'white' : 'grey-8'"
                    >{{ i + 1 }}</q-avatar
                  >
                </q-item-section>
                <q-item-section>{{ e.titulo }}</q-item-section>
              </q-item>
            </q-list>
            <div class="sf-rotulo q-mt-md">Conquistas: {{ conquistas.length }} de {{ etapas.length }}</div>
            <q-linear-progress
              :value="conquistas.length / etapas.length"
              color="secondary"
              rounded
              size="8px"
              class="q-mt-xs"
              aria-label="Conquistas"
            />
          </aside>

          <!-- Formulário -->
          <div class="sf-cadastro-centro">
            <div v-if="!desktop" class="sf-cadastro-topo">
              <div class="row items-center no-wrap" style="gap: 8px">
                <q-btn
                  v-if="indice > 0 && !fim"
                  flat
                  round
                  dense
                  icon="sym_r_arrow_back"
                  aria-label="Etapa anterior"
                  @click="indice--"
                />
                <div class="col">
                  <div class="sf-rotulo">
                    {{ fim ? 'Tudo pronto' : `Etapa ${indice + 1} de ${etapas.length}` }}
                  </div>
                  <b>{{ fim ? 'Seu primeiro período' : atual.titulo }}</b>
                </div>
                <q-btn v-if="!fim" flat dense no-caps color="primary" label="Pular" to="/" />
              </div>
              <q-linear-progress
                :value="Math.min(1, indice / etapas.length)"
                color="primary"
                rounded
                size="6px"
                class="q-mt-sm"
                aria-label="Progresso do cadastro"
              />
            </div>

            <div class="sf-cadastro-corpo">
              <div class="sf-cadastro-form">
                <template v-if="!fim">
                  <h1 v-if="desktop" style="font-size: 24px">{{ atual.titulo }}</h1>
                  <component
                    :is="COMPONENTES[atual.chave]"
                    v-model="respostas[atual.chave]"
                    v-bind="extras"
                  />
                </template>
                <template v-else>
                  <div class="text-center">
                    <SuriMascote expressao="comemorando" :tamanho="90" />
                    <h1 style="font-size: 24px; margin-top: 8px">
                      Tudo pronto, {{ respostas.boas_vindas?.apelido }}!
                    </h1>
                    <p v-if="previa.periodo" class="sf-muted q-mt-xs">
                      Seu período atual é
                      <b>{{ previa.periodo.nome }} · {{ previa.periodo.inicio }} a {{ previa.periodo.fim }}</b
                      >.
                    </p>
                  </div>
                  <div class="sf-pares" data-testid="fechamento">
                    <q-card flat bordered
                      ><q-card-section
                        ><div class="sf-rotulo">Contas</div>
                        <b>{{ respostas.contas?.contas.length }}</b></q-card-section
                      ></q-card
                    >
                    <q-card flat bordered
                      ><q-card-section
                        ><div class="sf-rotulo">Cartões</div>
                        <b>{{ respostas.cartoes?.cartoes.length }}</b></q-card-section
                      ></q-card
                    >
                    <q-card flat bordered
                      ><q-card-section
                        ><div class="sf-rotulo">Contas fixas</div>
                        <b>{{ respostas.contas_fixas?.fixas.length }}</b></q-card-section
                      ></q-card
                    >
                    <q-card flat bordered
                      ><q-card-section
                        ><div class="sf-rotulo">Sobra estimada por período</div>
                        <b class="sf-num">{{ brl(previa.sobra) }}</b></q-card-section
                      ></q-card
                    >
                  </div>
                  <div class="sf-rotulo">Conquistas: {{ conquistas.length }} de {{ etapas.length }}</div>
                  <div class="row" style="gap: 4px">
                    <q-chip
                      v-for="e in etapas"
                      :key="e.chave"
                      dense
                      :icon="conquistas.includes(e.conquista) ? 'sym_r_emoji_events' : 'sym_r_lock'"
                      :color="conquistas.includes(e.conquista) ? 'secondary' : undefined"
                      :text-color="conquistas.includes(e.conquista) ? 'white' : undefined"
                      >{{ e.conquista }}</q-chip
                    >
                  </div>
                  <q-btn
                    unelevated
                    color="primary"
                    size="lg"
                    icon-right="sym_r_arrow_forward"
                    label="Ver meu período"
                    no-caps
                    to="/"
                  />
                </template>
              </div>
            </div>

            <div v-if="!fim" class="sf-cadastro-rodape">
              <q-btn
                v-if="desktop && indice > 0"
                flat
                color="primary"
                icon="sym_r_arrow_back"
                label="Voltar"
                no-caps
                @click="indice--"
              />
              <q-btn v-if="!refazendo" flat color="primary" no-caps label="Pular etapa" @click="pularEtapa" />
              <q-btn
                v-else
                flat
                color="primary"
                no-caps
                label="Cancelar"
                :to="{ path: '/configuracoes', query: { aba: 'cadastro' } }"
              />
              <q-space />
              <q-btn
                unelevated
                color="primary"
                no-caps
                :label="refazendo ? 'Salvar' : indice === etapas.length - 1 ? 'Concluir' : 'Continuar'"
                icon-right="sym_r_arrow_forward"
                :loading="salvando"
                @click="continuar"
              />
            </div>
          </div>

          <!-- Prévia do período (desktop) -->
          <aside v-if="desktop" class="sf-cadastro-lado" data-testid="previa">
            <h2 style="font-size: 18px">Seu período tomando forma</h2>
            <div class="sf-rotulo q-mb-md">Atualiza enquanto você cadastra.</div>
            <q-card flat bordered class="q-mb-md">
              <q-card-section v-if="previa.periodo">
                <div class="sf-titulo" style="font-size: 16px">{{ previa.periodo.nome }}</div>
                <div class="sf-muted sf-num" style="font-size: 13px">
                  {{ previa.periodo.inicio }} a {{ previa.periodo.fim }}
                </div>
              </q-card-section>
              <q-card-section v-else class="sf-muted"
                >Informe o dia do salário na etapa Sua renda.</q-card-section
              >
            </q-card>
            <div class="column" style="gap: 8px">
              <div class="sf-linha">
                <span class="sf-muted">Entradas por período</span
                ><span class="sf-num text-positive">{{ brl(previa.entradas) }}</span>
              </div>
              <div class="sf-linha">
                <span class="sf-muted">Sua parte das contas fixas e parcelas</span
                ><span class="sf-num">− {{ brl(previa.minhasFixas) }}</span>
              </div>
              <div class="sf-linha">
                <span class="sf-muted">Limites de cartão e débito/Pix</span
                ><span class="sf-num">− {{ brl(previa.limites) }}</span>
              </div>
              <q-separator />
              <div class="sf-linha">
                <b>Sobra estimada por período</b>
                <b
                  class="sf-num"
                  :class="previa.sobra >= 0 ? 'text-positive' : 'text-negative'"
                  data-testid="sobra"
                  >{{ brl(previa.sobra) }}</b
                >
              </div>
              <div class="sf-rotulo">
                Vai para as metas: {{ respostas.objetivos?.metas.join(', ') || 'nenhuma escolhida ainda' }}.
              </div>
              <q-separator />
              <div class="sf-linha">
                <span class="sf-muted">Saldo nas suas contas hoje</span
                ><span class="sf-num">{{ brl(previa.saldoPessoal) }}</span>
              </div>
              <div class="sf-linha">
                <span class="sf-muted">Cartões</span>
                <span>{{ respostas.cartoes?.cartoes.map((c) => c.nome).join(', ') || '—' }}</span>
              </div>
            </div>
          </aside>
        </template>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
.sf-cadastro {
  display: flex;
  flex-direction: column;
}
.sf-cadastro--desktop {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 340px;
  height: 100vh;
}
.sf-cadastro-lado {
  padding: 24px;
  background: var(--sf-surface);
  border-right: 1px solid var(--sf-line);
  overflow-y: auto;
  &:last-child {
    border-right: 0;
    border-left: 1px solid var(--sf-line);
  }
}
.sf-cadastro-centro {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-height: 100vh;
  .sf-cadastro--desktop & {
    min-height: 0;
    height: 100vh;
  }
}
.sf-cadastro-topo {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 16px 16px 8px;
  background: var(--sf-surface);
  border-bottom: 1px solid var(--sf-line);
}
.sf-cadastro-corpo {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  .sf-cadastro--desktop & {
    padding: 32px;
  }
}
.sf-cadastro-form {
  display: grid;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
}
.sf-cadastro-rodape {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--sf-surface);
  border-top: 1px solid var(--sf-line);
}
.sf-linha {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  > :last-child {
    white-space: nowrap;
  }
}
</style>
