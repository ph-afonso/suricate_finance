<!-- Esqueci a senha (RF01): pede o e-mail; a resposta é sempre a mesma, para não revelar quem tem conta -->
<script setup>
import { ref } from 'vue'
import SuriMascote from 'components/SuriMascote.vue'
import { api } from 'src/composables/useSessao'

const email = ref('')
const enviando = ref(false)
const enviado = ref('')
const erro = ref('')

async function enviar() {
  enviando.value = true
  erro.value = ''
  try {
    enviado.value = (
      await api('auth/senha/esqueci', { metodo: 'POST', corpo: { email: email.value } })
    ).mensagem
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
      <h1 style="font-size: 22px">Esqueci a senha</h1>
      <p class="sf-muted q-mb-none">Mando um link para você criar uma senha nova.</p>
    </div>
    <q-banner v-if="enviado" rounded class="bg-positive text-white" role="status">{{ enviado }}</q-banner>
    <q-banner v-if="erro" rounded dense class="bg-negative text-white" role="alert">{{ erro }}</q-banner>
    <q-form v-if="!enviado" class="sf-acesso-form" @submit.prevent="enviar">
      <q-input v-model="email" outlined dense type="email" label="E-mail" autocomplete="email" required />
      <q-btn unelevated color="primary" type="submit" label="Enviar o link" no-caps :loading="enviando" />
    </q-form>
    <q-btn flat color="primary" no-caps label="Voltar para entrar" to="/entrar" />
  </div>
</template>
