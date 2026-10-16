<!-- Termos de uso e política de privacidade (RNF04). Rascunho: precisa de revisão jurídica antes de abrir ao público -->
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ tipo: { type: String, required: true } })
const router = useRouter()

const VERSAO = '2026-10'

const DOCUMENTOS = {
  termos: {
    titulo: 'Termos de uso',
    secoes: [
      [
        'O que é o Suricate',
        'O Suricate Finance organiza suas finanças pelo período do seu salário. Ele mostra contas, cartões e limites e sugere quanto dá para gastar. As sugestões são uma ajuda para você decidir: o Suricate não é consultoria financeira, não movimenta dinheiro e não pede senha de banco.',
      ],
      [
        'Sua conta',
        'Você cria a conta com e-mail e senha ou com a conta Google. Guarde sua senha com cuidado: quem souber a senha vê os seus dados. Você pode sair de todos os aparelhos trocando a senha e pode excluir a conta quando quiser, em Configurações.',
      ],
      [
        'Uso correto',
        'Use o Suricate só para as suas finanças ou as da sua família. Não tente acessar dados de outras pessoas, sobrecarregar o serviço ou usar o app para algo ilegal.',
      ],
      [
        'Disponibilidade',
        'O Suricate está em desenvolvimento e pode mudar ou ficar fora do ar em alguns momentos. A página Status do sistema mostra se ele está funcionando. As novidades de cada versão ficam na página Novidades.',
      ],
      [
        'Sugestões',
        'O que você manda pela aba Sugestões vira uma issue pública no GitHub do projeto, sem seu nome nem seu e-mail. Não escreva dados pessoais no texto.',
      ],
      [
        'Mudanças nestes termos',
        'Quando os termos mudarem, o app pede um novo aceite antes de você continuar.',
      ],
    ],
  },
  privacidade: {
    titulo: 'Política de privacidade',
    secoes: [
      [
        'O que guardamos',
        'Nome, e-mail e, se você usar senha, só uma versão embaralhada dela (hash argon2id). Se entrar com Google, guardamos o identificador da sua conta Google. Guardamos também as respostas do cadastro guiado (renda, contas, cartões, contas fixas, família e metas), as sessões abertas e as tentativas de login, que servem para proteger sua conta.',
      ],
      [
        'Para que usamos',
        'Só para fazer o Suricate funcionar para você: calcular seus períodos, mostrar suas contas e proteger o acesso. Não vendemos nem compartilhamos seus dados para publicidade.',
      ],
      [
        'Onde ficam',
        'O banco de dados fica no Neon, em São Paulo. O app roda na Vercel. O e-mail de redefinição de senha sai por um endereço do Gmail. O login com Google passa pelo Google. As sugestões vão para o GitHub, sem dados que identifiquem você.',
      ],
      [
        'Cookies',
        'Usamos um cookie só para manter você conectado (por até 30 dias) e outro, de 10 minutos, durante o login com Google. Não usamos cookies de propaganda nem de rastreamento.',
      ],
      [
        'Seus direitos (LGPD)',
        'Você pode ver e corrigir seus dados no app, excluir a conta e tudo dela em Configurações, e pedir uma cópia dos seus dados. A exportação em planilha chega numa próxima versão.',
      ],
      ['Por quanto tempo', 'Enquanto a conta existir. Ao excluir a conta, apagamos tudo na hora.'],
    ],
  },
}

const doc = computed(() => DOCUMENTOS[props.tipo])
</script>

<template>
  <div class="sf-acesso-form">
    <div>
      <h1 style="font-size: 22px">{{ doc.titulo }}</h1>
      <div class="sf-muted" style="font-size: 13px">Versão {{ VERSAO }} · rascunho em revisão</div>
    </div>
    <section v-for="[titulo, texto] in doc.secoes" :key="titulo">
      <h2 style="font-size: 16px; margin-bottom: 4px">{{ titulo }}</h2>
      <p class="q-mb-none" style="line-height: 1.5">{{ texto }}</p>
    </section>
    <q-btn flat color="primary" no-caps icon="sym_r_arrow_back" label="Voltar" @click="router.back()" />
  </div>
</template>
