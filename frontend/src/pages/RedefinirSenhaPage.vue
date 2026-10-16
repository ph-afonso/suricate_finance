<!-- Redefinir a senha pelo link do e-mail (RF01). O link vale 1 hora e uma vez só -->
<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SuriMascote from 'components/SuriMascote.vue'
import { api, destinoDepoisDoLogin, useSessao } from 'src/composables/useSessao'

const route = useRoute()
const router = useRouter()
const { atualizar } = useSessao()

const senha = ref('')
const enviando = ref(false)
const erro = ref(route.query.token ? '' : 'Link incompleto. Abra de novo o link do e-mail.')

async function enviar() {
  enviando.value = true
  erro.value = ''
  try {
    const resumo = await api('auth/senha/redefinir', {
      metodo: 'POST',
      corpo: { token: route.query.token, senha: senha.value },
    })
    atualizar(resumo)
    await router.replace(destinoDepoisDoLogin(resumo))
  } catch (e) {
    erro.value = e.message
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="sf-acesso-form">
    <div class="sf-acesso-topo">
      <SuriMascote expressao="vigia" :tamanho="64" />
      <h1 style="font-size: 22px">Senha nova</h1>
      <p class="sf-muted q-mb-none">Depois de salvar, as outras sessões abertas saem da conta.</p>
    </div>
    <q-banner v-if="erro" rounded dense class="bg-negative text-white" role="alert">
      {{ erro }}
      <template #action>
        <q-btn flat dense no-caps color="white" label="Pedir outro link" to="/esqueci-a-senha" />
      </template>
    </q-banner>
    <q-form class="sf-acesso-form" @submit.prevent="enviar">
      <q-input
        v-model="senha"
        outlined
        dense
        type="password"
        label="Senha nova"
        hint="Mínimo de 8 caracteres"
        autocomplete="new-password"
        required
        :rules="[(v) => (v && v.length >= 8) || 'Use pelo menos 8 caracteres']"
        lazy-rules
      />
      <q-btn
        unelevated
        color="primary"
        type="submit"
        label="Salvar e entrar"
        no-caps
        :loading="enviando"
        :disable="!route.query.token"
      />
    </q-form>
  </div>
</template>
