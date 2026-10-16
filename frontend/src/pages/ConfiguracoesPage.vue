<!-- T16 · Configurações (parte do M2): Perfil (nome, apelido, sair, excluir conta) e Cadastro guiado
     (refazer qualquer etapa, RF04). As abas de regras do período chegam no M3. -->
<script setup>
import { onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { api, useSessao } from 'src/composables/useSessao'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { usuario, atualizar, sair } = useSessao()

const aba = ref(route.query.aba === 'cadastro' ? 'cadastro' : 'perfil')
const nome = ref(usuario.value?.nome || '')
const apelido = ref(usuario.value?.apelido || '')
const salvando = ref(false)
const etapas = ref([])
const excluindo = ref(false)
const confirmacao = ref('')
const erroExclusao = ref('')

const STATUS = {
  concluida: ['positive', 'Concluída'],
  pulada: ['warning', 'Pulada'],
  nao_feita: ['grey-6', 'Não feita'],
}

onMounted(async () => {
  try {
    etapas.value = (await api('onboarding')).etapas
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  }
})
watch(aba, (valor) => router.replace({ query: valor === 'cadastro' ? { aba: valor } : {} }))

async function salvarPerfil() {
  salvando.value = true
  try {
    atualizar(await api('usuario', { metodo: 'PATCH', corpo: { nome: nome.value, apelido: apelido.value } }))
    $q.notify({ type: 'positive', message: 'Perfil salvo.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    salvando.value = false
  }
}

async function sairDaConta() {
  await sair()
  await router.replace('/entrar')
}

async function excluirConta() {
  erroExclusao.value = ''
  const corpo = usuario.value.tem_senha ? { senha: confirmacao.value } : { confirmacao: confirmacao.value }
  try {
    await api('usuario', { metodo: 'DELETE', corpo })
    atualizar(null)
    await router.replace('/entrar')
    $q.notify({ message: 'Sua conta e todos os seus dados foram apagados.' })
  } catch (e) {
    erroExclusao.value = e.message
  }
}
</script>

<template>
  <q-page padding>
    <div class="column no-wrap q-gutter-md" style="max-width: 720px; margin: 0 auto">
      <h1 style="font-size: 24px">Configurações</h1>
      <q-tabs v-model="aba" dense align="left" active-color="primary" indicator-color="primary" no-caps>
        <q-tab name="perfil" label="Perfil" />
        <q-tab name="cadastro" label="Cadastro guiado" />
      </q-tabs>

      <template v-if="aba === 'perfil'">
        <q-card flat bordered class="sf-card">
          <q-card-section class="column q-gutter-md">
            <q-input v-model="nome" outlined label="Nome" maxlength="120" />
            <q-input v-model="apelido" outlined label="Como o Suri te chama" maxlength="40" />
            <q-input :model-value="usuario?.email" outlined readonly label="E-mail" />
            <div class="sf-rotulo">
              Entrada com:
              {{
                [usuario?.tem_senha && 'e-mail e senha', usuario?.tem_google && 'Google']
                  .filter(Boolean)
                  .join(' e ')
              }}
            </div>
            <div class="row" style="gap: 8px">
              <q-btn unelevated color="primary" label="Salvar" :loading="salvando" @click="salvarPerfil" />
              <q-btn flat color="primary" icon="sym_r_logout" label="Sair da conta" @click="sairDaConta" />
            </div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="sf-card">
          <q-card-section>
            <h2 style="font-size: 16px">Excluir minha conta</h2>
            <p class="sf-muted q-mb-sm q-mt-xs">
              Apaga na hora a conta, o cadastro guiado e as suas sugestões. Não dá para desfazer.
            </p>
            <q-btn outline color="negative" label="Excluir minha conta" @click="excluindo = true" />
          </q-card-section>
        </q-card>
      </template>

      <q-card v-else flat bordered class="sf-card">
        <q-card-section class="sf-muted"
          >Refaça qualquer etapa: as respostas novas substituem as antigas.</q-card-section
        >
        <q-list separator>
          <q-item v-for="e in etapas" :key="e.chave">
            <q-item-section>
              <q-item-label>{{ e.titulo }}</q-item-label>
              <q-item-label caption>Conquista: {{ e.conquista }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="STATUS[e.status][0]" :label="STATUS[e.status][1]" />
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                dense
                color="primary"
                :label="e.status === 'concluida' ? 'Refazer' : 'Fazer'"
                :to="{ path: `/cadastro-guiado/${e.chave}`, query: { refazer: '1' } }"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <q-dialog v-model="excluindo">
      <q-card style="width: 400px; max-width: 92vw">
        <q-card-section>
          <h2 style="font-size: 18px">Excluir a conta?</h2>
          <p class="q-mt-sm q-mb-none">
            {{ usuario?.tem_senha ? 'Digite sua senha para confirmar.' : 'Digite EXCLUIR para confirmar.' }}
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="confirmacao"
            outlined
            dense
            autofocus
            :type="usuario?.tem_senha ? 'password' : 'text'"
            :label="usuario?.tem_senha ? 'Senha' : 'EXCLUIR'"
          />
          <div v-if="erroExclusao" class="text-negative q-mt-sm" role="alert">{{ erroExclusao }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn
            unelevated
            color="negative"
            label="Excluir tudo"
            :disable="!confirmacao"
            @click="excluirConta"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
