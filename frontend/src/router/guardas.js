// Guardas de rota (seção 7 da documentação técnica do M2, CT33).
// - Sem sessão: só as rotas com meta.publica abrem; as outras levam a /entrar e voltam depois.
// - Com sessão e termos pendentes (primeiro login com Google): tudo leva a /boas-vindas.
// - Ao abrir o app com o cadastro guiado incompleto, ele começa na etapa salva (RF04).
import { START_LOCATION } from 'vue-router'
import { useSessao } from 'src/composables/useSessao'

let ultimaTela = null

// Tela onde a pessoa estava antes da atual, para a aba Sugestões preencher sozinha
export const telaAnterior = () => ultimaTela

export function instalarGuardas(router) {
  router.beforeEach(async (to, from) => {
    const sessao = useSessao()
    if (!sessao.carregado.value) await sessao.carregar()
    const usuario = sessao.usuario.value

    if (!usuario) {
      return to.meta.publica ? true : { path: '/entrar', query: { volta: to.fullPath } }
    }
    if (to.meta.soSemSessao) return '/'
    if (usuario.termos_pendentes) return to.name === 'boas-vindas' || to.meta.publica ? true : '/boas-vindas'
    if (to.name === 'boas-vindas') return '/'
    if (from === START_LOCATION && to.path === '/' && !usuario.onboarding.concluido) return '/cadastro-guiado'
    return true
  })
  router.afterEach((to, from) => {
    if (from !== START_LOCATION) ultimaTela = from.fullPath
  })
}
