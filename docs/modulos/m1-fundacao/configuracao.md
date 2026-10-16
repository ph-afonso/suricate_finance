# M1 · Configuração do Neon, da Vercel e do GitHub

Roteiro das tarefas #112 (Neon), #113 (Vercel) e #114 (pré-produção). O Claude conduz pelo navegador e pela linha de comando. **Senhas, strings de conexão, chaves e tokens são colados pelo Phelipe**: o Claude não digita credenciais em formulários.

Legenda: 🧑 Phelipe · 🤖 Claude

## Parte 1 · Neon (banco)

| # | Quem | Passo |
| --- | --- | --- |
| 1 | 🧑 | Entrar em [console.neon.tech](https://console.neon.tech) com **Continue with GitHub** |
| 2 | 🤖 | Criar o projeto `suricate-finance` pela integração Neon da Vercel (Storage › Create Database), região São Paulo (`gru1`), ligado ao projeto só em Production com o prefixo `DATABASE` (gera `DATABASE_URL` e `DATABASE_URL_UNPOOLED`). ID do projeto: `soft-paper-17185054` |
| 3 | 🤖 | Criar os ramos `dev` e `staging` a partir de `main`, com exclusão automática **Never** |
| 4 | 🧑 | Criar uma chave da API do Neon (Account settings › API keys), para a Action da pré-produção |

Cada ramo tem duas strings de conexão: **com pool** (endereço com `-pooler`, usada pelo app) e **direta** (sem `-pooler`, usada nas migrações).

## Parte 2 · GitHub (segredos)

| # | Quem | Passo |
| --- | --- | --- |
| 5 | 🤖 | Criar os ambientes `development`, `staging` e `production` no repositório (Settings › Environments) |
| 6 | 🧑 | Em cada ambiente, criar o segredo `DATABASE_URL_DIRECT` com a string **direta** do ramo correspondente: `development` → ramo `dev`, `staging` → ramo `staging`, `production` → ramo `main` |
| 7 | 🧑 | No ambiente `staging`, criar também `NEON_API_KEY` (a chave do passo 4) e `NEON_PROJECT_ID` (o Claude informa o valor) |
| 8 | 🤖 | Rodar a Action **Migrações** em `development` (com o seed do usuário 1) e em `production` |

## Parte 3 · Vercel (hospedagem)

| # | Quem | Passo |
| --- | --- | --- |
| 9 | 🧑 | Entrar em [vercel.com](https://vercel.com) com **Continue with GitHub** e autorizar o acesso ao repositório `suricate_finance` |
| 10 | 🤖 | Importar o projeto `suricate-finance`, sem framework (o `vercel.json` já define o build) |
| 11 | 🤖 | Criar o ramo `staging` no GitHub e as variáveis sem segredo: `APP_ENV` (`production` em Production, `development` em Preview, `staging` no Preview do ramo `staging`) e `STATUS_AMBIENTES` |
| 12 | 🧑 | Criar a variável `DATABASE_URL` com a string **com pool**: Preview → ramo `dev`; Preview do ramo `staging` → ramo `staging` (Production já vem da integração) |
| 13 | 🤖 | Conferir a proteção dos previews (Deployment Protection), que inclui a pré-produção |
| 14 | 🧑 | Gerar o segredo de *Protection Bypass for Automation* e salvá-lo no GitHub como segredo do repositório `VERCEL_AUTOMATION_BYPASS_SECRET` (para os testes de ponta a ponta) |
| 15 | 🤖 | Fazer o primeiro deploy e conferir `/api/health` nos três ambientes |

## Parte 4 · Página de status (opcional agora)

| # | Quem | Passo |
| --- | --- | --- |
| 16 | 🧑 | Criar um token da Vercel só de leitura e salvá-lo como `VERCEL_API_TOKEN` nas variáveis da Vercel (Production) |
| 17 | 🤖 | Configurar `VERCEL_PROJECT_ID` |

Sem os passos 16 e 17, a página de status mostra os ambientes e a pipeline, mas não os últimos deploys.
