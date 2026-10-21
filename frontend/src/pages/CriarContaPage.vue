<!-- T02 · Cadastro (RF01): nome, e-mail, senha e aceite dos termos (LGPD) -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SuriMascote from 'components/SuriMascote.vue'
import { useSessao } from 'src/composables/useSessao'

const router = useRouter()
const { cadastrar } = useSessao()

const nome = ref('')
const email = ref('')
const senha = ref('')
const termos = ref(false)
const enviando = ref(false)
const erro = ref('')

async function enviar() {
  enviando.value = true
  erro.value = ''
  try {
    await cadastrar({ nome: nome.value, email: email.value, senha: senha.value, aceite_termos: termos.value })
    await router.replace('/cadastro-guiado')
  } catch (e) {
    erro.value = e.message
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="sf-acesso-form">
    <div class="row items-center no-wrap" style="gap: 12px">
      <SuriMascote expressao="feliz" :tamanho="48" />
      <div>
        <h1 style="font-size: 22px; margin: 0">Criar conta</h1>
        <div class="sf-muted" style="font-size: 13px">
          Leva menos de um minuto. Depois, o Suri te ajuda a cadastrar tudo.
        </div>
      </div>
    </div>

    <q-banner v-if="erro" rounded dense class="bg-negative text-white" role="alert">{{ erro }}</q-banner>

    <q-btn
      outline
      color="primary"
      icon="sym_r_login"
      label="Criar com Google"
      no-caps
      href="/api/auth/google/inicio"
    />
    <div class="sf-muted text-center" style="font-size: 13px">ou com e-mail</div>

    <q-form class="sf-acesso-form" @submit.prevent="enviar">
      <q-input v-model="nome" outlined dense label="Nome" autocomplete="name" required maxlength="120" />
      <q-input v-model="email" outlined dense type="email" label="E-mail" autocomplete="email" required />
      <q-input
        v-model="senha"
        outlined
        dense
        type="password"
        label="Senha"
        hint="Mínimo de 8 caracteres"
        autocomplete="new-password"
        required
        :rules="[(v) => (v && v.length >= 8) || 'Use pelo menos 8 caracteres']"
        lazy-rules
      />
      <!-- Os links ficam fora do rótulo: um link dentro do checkbox é um controle dentro de outro (RNF07) -->
      <q-checkbox
        v-model="termos"
        dense
        label="Li e aceito os termos de uso e a política de privacidade (LGPD)"
      />
      <div class="sf-muted" style="font-size: 13px; margin-top: -8px; padding-left: 28px">
        Leia os <router-link to="/termos" target="_blank">termos de uso</router-link> e a
        <router-link to="/privacidade" target="_blank">política de privacidade</router-link>.
      </div>
      <q-btn
        unelevated
        color="primary"
        type="submit"
        label="Criar conta"
        no-caps
        :disable="!termos"
        :loading="enviando"
      />
    </q-form>
    <q-btn flat color="primary" no-caps label="Já tenho conta" to="/entrar" />
  </div>
</template>
