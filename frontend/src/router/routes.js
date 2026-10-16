// Rotas do app. meta.publica abre sem login; meta.soSemSessao some para quem já entrou (guardas.js).
// Os destinos ainda não construídos mostram em que módulo chegam.
const emBreve = (titulo, modulo) => ({
  component: () => import('pages/EmBrevePage.vue'),
  props: { titulo, modulo },
})
const publica = { publica: true }
const deslogado = { publica: true, soSemSessao: true }

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'inicio', component: () => import('pages/IndexPage.vue') },
      { path: 'status', name: 'status', meta: publica, component: () => import('pages/StatusPage.vue') },
      {
        path: 'novidades',
        name: 'novidades',
        meta: publica,
        component: () => import('pages/NovidadesPage.vue'),
      },
      { path: 'sugestoes', name: 'sugestoes', component: () => import('pages/SugestoesPage.vue') },
      {
        path: 'configuracoes',
        name: 'configuracoes',
        component: () => import('pages/ConfiguracoesPage.vue'),
      },
      { path: 'lancamentos', name: 'lancamentos', ...emBreve('Lançamentos', 'M4 · Contas e lançamentos') },
      { path: 'cartoes', name: 'cartoes', ...emBreve('Cartões', 'M5 · Cartões') },
      { path: 'familia', name: 'familia', ...emBreve('Família', 'M6 · Modo família') },
      { path: 'planejamento', name: 'planejamento', ...emBreve('Planejamento', 'M7 · Planejamento') },
      { path: 'contas', name: 'contas', ...emBreve('Contas', 'M4 · Contas e lançamentos') },
      { path: 'categorias', name: 'categorias', ...emBreve('Categorias', 'M4 · Contas e lançamentos') },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/AcessoLayout.vue'),
    children: [
      { path: 'entrar', name: 'entrar', meta: deslogado, component: () => import('pages/EntrarPage.vue') },
      {
        path: 'criar-conta',
        name: 'criar-conta',
        meta: deslogado,
        component: () => import('pages/CriarContaPage.vue'),
      },
      {
        path: 'esqueci-a-senha',
        name: 'esqueci-a-senha',
        meta: publica,
        component: () => import('pages/EsqueciSenhaPage.vue'),
      },
      {
        path: 'redefinir-senha',
        name: 'redefinir-senha',
        meta: publica,
        component: () => import('pages/RedefinirSenhaPage.vue'),
      },
      { path: 'boas-vindas', name: 'boas-vindas', component: () => import('pages/BoasVindasPage.vue') },
      {
        path: 'termos',
        name: 'termos',
        meta: publica,
        component: () => import('pages/DocumentoLegalPage.vue'),
        props: { tipo: 'termos' },
      },
      {
        path: 'privacidade',
        name: 'privacidade',
        meta: publica,
        component: () => import('pages/DocumentoLegalPage.vue'),
        props: { tipo: 'privacidade' },
      },
    ],
  },
  {
    path: '/cadastro-guiado/:etapa?',
    name: 'cadastro-guiado',
    component: () => import('pages/CadastroGuiadoPage.vue'),
  },
  { path: '/:catchAll(.*)*', meta: publica, component: () => import('pages/ErrorNotFound.vue') },
]

export default routes
