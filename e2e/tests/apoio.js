// Apoio aos testes de ponta a ponta: contas descartáveis no banco do ambiente testado.
// Os e-mails seguem o padrão e2e+<aleatório>@teste.suricate.app, que a limpeza diária apaga (M2, seção 10).
export const SENHA = 'senha-de-teste-e2e'

export function emailDeTeste() {
  return `e2e+${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@teste.suricate.app`
}

const API = { 'X-Suricate': '1' }

// Cria a conta pela API: o cookie de sessão fica no contexto do navegador do teste
export async function entrarComContaNova(page, { concluirCadastro = true } = {}) {
  const email = emailDeTeste()
  const r = await page.request.post('/api/auth/cadastro', {
    headers: API,
    data: { nome: 'Teste E2E', email, senha: SENHA, aceite_termos: true },
  })
  if (!r.ok()) throw new Error(`cadastro falhou: ${r.status()} ${await r.text()}`)
  if (concluirCadastro) await page.request.post('/api/onboarding/concluir', { headers: API })
  return email
}
