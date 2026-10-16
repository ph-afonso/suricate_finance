<!-- Aba Sugestões (#106): lista "Minhas sugestões" com o status e um formulário que vira issue no GitHub.
     A tela de origem vai junto, preenchida sozinha. Sem dados pessoais: o repositório é público. -->
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import SuriMascote from 'components/SuriMascote.vue'
import EscolhaChips from 'components/cadastro/EscolhaChips.vue'
import { api } from 'src/composables/useSessao'
import { telaAnterior } from 'src/router/guardas'

const $q = useQuasar()
const sugestoes = ref([])
const carregando = ref(true)
const abrindo = ref(false)
const enviando = ref(false)
const nova = reactive({ tipo: 'melhoria', titulo: '', descricao: '' })

const TIPOS = [
  ['melhoria', 'Melhoria'],
  ['problema', 'Problema'],
  ['ideia', 'Ideia'],
]
const NOME_TIPO = Object.fromEntries(TIPOS)
const STATUS = {
  recebida: ['info', 'Recebida'],
  planejada: ['secondary', 'Planejada'],
  entregue: ['positive', 'Entregue'],
  nao_sera_feita: ['grey-7', 'Não será feita'],
}

async function carregar() {
  carregando.value = true
  try {
    sugestoes.value = await api('sugestoes')
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    carregando.value = false
  }
}
onMounted(carregar)

async function enviar() {
  enviando.value = true
  try {
    const s = await api('sugestoes', { metodo: 'POST', corpo: { ...nova, tela: telaAnterior() } })
    sugestoes.value = [s, ...sugestoes.value]
    Object.assign(nova, { tipo: 'melhoria', titulo: '', descricao: '' })
    abrindo.value = false
    $q.notify({ type: 'positive', message: `Recebi sua sugestão ${s.codigo}. Obrigado!` })
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    enviando.value = false
  }
}

const data = (iso) => new Date(iso).toLocaleDateString('pt-BR')
</script>

<template>
  <q-page padding>
    <div class="column no-wrap q-gutter-md" style="max-width: 720px; margin: 0 auto">
      <div class="row items-center">
        <h1 style="font-size: 24px">Sugestões</h1>
        <q-space />
        <q-btn unelevated color="primary" icon="sym_r_add" label="Nova sugestão" @click="abrindo = true" />
      </div>
      <div class="sf-dica">
        <SuriMascote :tamanho="44" />
        <p>
          Teve uma ideia ou achou um problema? Conte aqui. Eu leio todas, e você acompanha o andamento nesta
          lista.
        </p>
      </div>

      <q-card flat bordered class="sf-card">
        <q-card-section class="sf-titulo" style="font-size: 16px">Minhas sugestões</q-card-section>
        <div v-if="carregando" class="q-pa-md flex flex-center"><q-spinner color="primary" /></div>
        <div v-else-if="!sugestoes.length" class="q-pa-md sf-muted">
          Você ainda não mandou nenhuma sugestão.
        </div>
        <q-list v-else separator>
          <q-item v-for="s in sugestoes" :key="s.codigo" data-testid="sugestao">
            <q-item-section>
              <q-item-label>{{ s.titulo }}</q-item-label>
              <q-item-label caption
                >{{ NOME_TIPO[s.tipo] }} · {{ s.codigo }} · {{ data(s.criada_em) }}</q-item-label
              >
            </q-item-section>
            <q-item-section side>
              <q-chip dense :color="STATUS[s.status][0]" text-color="white" :label="STATUS[s.status][1]" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <q-dialog v-model="abrindo">
      <q-card style="width: 520px; max-width: 94vw">
        <q-form @submit.prevent="enviar">
          <q-card-section>
            <h2 style="font-size: 18px">Nova sugestão</h2>
          </q-card-section>
          <q-card-section class="q-pt-none column q-gutter-md">
            <EscolhaChips v-model="nova.tipo" :opcoes="TIPOS" rotulo="Tipo de sugestão" />
            <q-input v-model="nova.titulo" outlined label="Título" maxlength="100" counter required />
            <q-input
              v-model="nova.descricao"
              outlined
              type="textarea"
              autogrow
              label="Conte os detalhes"
              maxlength="2000"
              counter
              required
              :rules="[(v) => (v && v.trim().length >= 10) || 'Escreva pelo menos 10 caracteres']"
              lazy-rules
            />
            <div class="sf-dica" style="font-size: 13px">
              <q-icon name="sym_r_shield" color="primary" size="20px" />
              <p>
                A sugestão fica pública no GitHub do projeto, sem seu nome nem seu e-mail. Não escreva dados
                pessoais (e-mail, telefone, CPF, número de cartão): se escrever, eu apago antes de enviar.
              </p>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat label="Cancelar" />
            <q-btn unelevated color="primary" type="submit" label="Enviar" :loading="enviando" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
