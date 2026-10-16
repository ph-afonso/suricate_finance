// Chamadas à API (mesmo domínio, sob /api). Devolve o JSON mesmo quando a resposta é 503 da rota de saúde.
import { ref } from 'vue'

export function useApi(caminho) {
  const dados = ref(null)
  const erro = ref(null)
  const carregando = ref(false)

  async function carregar() {
    carregando.value = true
    erro.value = null
    try {
      const resposta = await fetch(`/api/${caminho}`, { headers: { Accept: 'application/json' } })
      const tipo = resposta.headers.get('content-type') || ''
      if (!tipo.includes('application/json')) throw new Error(`Resposta inesperada (${resposta.status})`)
      dados.value = await resposta.json()
    } catch (e) {
      erro.value = 'Não foi possível falar com a API. Verifique a conexão e tente de novo.'
      dados.value = null
      console.warn(e)
    } finally {
      carregando.value = false
    }
  }

  return { dados, erro, carregando, carregar }
}
