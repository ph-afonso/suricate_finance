<!-- Aceite dos termos no primeiro login com Google (RNF04) -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SuriMascote from 'components/SuriMascote.vue'
import { api, destinoDepoisDoLogin, useSessao } from 'src/composables/useSessao'

const router = useRouter()
const { usuario, atualizar, sair } = useSessao()
const enviando = ref(false)
const erro = ref('')

async function aceitar() {
  enviando.value = true
  try {
    const resumo = await api('auth/termos', { metodo: 'POST' })
    atualizar(resumo)
    await router.replace(destinoDepoisDoLogin(resumo))
  } catch (e) {
    erro.value = e.message
  } finally {
    enviando.value = false
  }
}

async function recusar() {
  await sair()
  await router.replace('/entrar')
}
</script>

<template>
  <div class="sf-acesso-form">
    <div class="sf-acesso-topo">
      <SuriMascote expressao="feliz" :tamanho="72" />
      <h1 style="font-size: 22px">Oi, {{ usuario?.nome?.split(' ')[0] }}!</h1>
      <p class="sf-muted q-mb-none">
        Antes de começar, leia os <router-link to="/termos" target="_blank">termos de uso</router-link> e a
        <router-link to="/privacidade" target="_blank">política de privacidade</router-link>. Eles dizem o que
        o Suricate guarda e o que você pode pedir a qualquer momento.
      </p>
    </div>
    <q-banner v-if="erro" rounded dense class="bg-negative text-white" role="alert">{{ erro }}</q-banner>
    <q-btn
      unelevated
      color="primary"
      label="Aceito e continuar"
      no-caps
      :loading="enviando"
      @click="aceitar"
    />
    <q-btn flat color="primary" label="Agora não (sair)" no-caps @click="recusar" />
  </div>
</template>
