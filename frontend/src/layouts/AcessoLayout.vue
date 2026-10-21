<!-- Telas de acesso (T01, T02 e as de senha e termos): cartão central sobre fundo ilustrado, sem menu -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="sf-acesso">
        <q-card flat bordered class="sf-acesso-cartao">
          <router-view />
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
.sf-acesso {
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background:
    radial-gradient(circle at 20% 20%, rgba(168, 90, 42, 0.16), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(47, 93, 80, 0.16), transparent 50%), var(--sf-bg);
}
.sf-acesso-cartao {
  width: 100%;
  max-width: 420px;
  padding: 28px 24px;
  border-radius: 16px;
}
.sf-acesso-form {
  display: grid;
  gap: 14px;
  // links de texto (termos, privacidade) na cor do guia visual, não no azul do navegador
  a:not(.q-btn) {
    color: var(--q-primary);
  }
}
.sf-acesso-topo {
  text-align: center;
  h1 {
    font-size: 26px;
    margin: 8px 0 4px;
  }
}
@media (max-width: 599px) {
  .sf-acesso-cartao {
    border: 0;
    background: transparent;
    padding: 8px 0;
  }
}
</style>
