<!-- T01 · Boas-vindas e login (RF01): Google, e-mail e senha, esqueci a senha, criar conta -->
<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SuriMascote from 'components/SuriMascote.vue'
import { destinoDepoisDoLogin, useSessao } from 'src/composables/useSessao'

const route = useRoute()
const router = useRouter()
const { entrar } = useSessao()

const email = ref('')
const senha = ref('')
const enviando = ref(false)
const erro = ref(route.query.erro || '')

async function enviar() {
  enviando.value = true
  erro.value = ''
  try {
    const resumo = await entrar(email.value, senha.value)
    await router.replace(destinoDepoisDoLogin(resumo, route.query.volta))
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
      <SuriMascote expressao="vigia" :tamanho="84" />
      <h1>Suricate Finance</h1>
      <p class="sf-muted q-mb-none">Suas finanças no ritmo do seu salário.</p>
    </div>

    <q-banner v-if="erro" rounded dense class="bg-negative text-white" role="alert">{{ erro }}</q-banner>

    <q-btn
      outline
      color="primary"
      icon="sym_r_login"
      label="Entrar com Google"
      no-caps
      href="/api/auth/google/inicio"
    />
    <div class="sf-muted text-center" style="font-size: 13px">ou com e-mail</div>

    <q-form class="sf-acesso-form" @submit.prevent="enviar">
      <q-input v-model="email" outlined dense type="email" label="E-mail" autocomplete="email" required />
      <q-input
        v-model="senha"
        outlined
        dense
        type="password"
        label="Senha"
        autocomplete="current-password"
        required
      />
      <q-btn unelevated color="primary" type="submit" label="Entrar" no-caps :loading="enviando" />
    </q-form>
    <div class="row justify-between">
      <q-btn flat dense color="primary" no-caps label="Esqueci a senha" to="/esqueci-a-senha" />
      <q-btn
        flat
        dense
        color="primary"
        no-caps
        label="Ainda não tenho conta"
        :to="{ path: '/criar-conta', query: route.query.volta ? { volta: route.query.volta } : {} }"
      />
    </div>
  </div>
</template>
