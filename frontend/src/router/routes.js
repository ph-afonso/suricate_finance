// No M1 só existem Início, Status e Novidades; os outros destinos mostram em que módulo chegam.
const emBreve = (titulo, modulo) => ({
  component: () => import('pages/EmBrevePage.vue'),
  props: { titulo, modulo },
})

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'inicio', component: () => import('pages/IndexPage.vue') },
      { path: 'status', name: 'status', component: () => import('pages/StatusPage.vue') },
      { path: 'novidades', name: 'novidades', component: () => import('pages/NovidadesPage.vue') },
      { path: 'lancamentos', name: 'lancamentos', ...emBreve('Lançamentos', 'M4 · Contas e lançamentos') },
      { path: 'cartoes', name: 'cartoes', ...emBreve('Cartões', 'M5 · Cartões') },
      { path: 'familia', name: 'familia', ...emBreve('Família', 'M6 · Modo família') },
      { path: 'planejamento', name: 'planejamento', ...emBreve('Planejamento', 'M7 · Planejamento') },
      { path: 'contas', name: 'contas', ...emBreve('Contas', 'M4 · Contas e lançamentos') },
      { path: 'categorias', name: 'categorias', ...emBreve('Categorias', 'M4 · Contas e lançamentos') },
      {
        path: 'configuracoes',
        name: 'configuracoes',
        ...emBreve('Configurações', 'M2 · Acesso e onboarding'),
      },
    ],
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
]

export default routes
