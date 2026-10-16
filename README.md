# suricate_finance

Suricate Finance: app de finanças pessoais organizado por **períodos que começam quando o salário entra**, e não por meses de calendário. O mascote Suri conduz o onboarding e dá sugestões de quanto ainda dá para gastar no período.

## Documentação

- [Análise e Requisitos](https://claude.ai/code/artifact/383dc308-00c9-4c01-9659-85308904fd79): análise do Mobills, regras de negócio (RN01–RN31), requisitos (RF01–RF45), onboarding e fases.
- [Processo de trabalho](docs/processo.md): milestones, as 4 etapas de cada módulo e como aprovar uma entrega.
- [Quadro do projeto](https://github.com/users/ph-afonso/projects/2)

## Tecnologia (aprovada na revisão 2)

| Camada | Escolha |
| --- | --- |
| Front | Quasar (Vue 3), modo PWA |
| Back | Python + FastAPI, como Vercel Functions |
| Banco | Postgres no Neon |
| Hospedagem | Vercel |

## Fluxo de trabalho (Git Flow)

| Ramo | Ambiente | Banco |
| --- | --- | --- |
| `main` | Produção | Banco de produção |
| `release/*`, `hotfix/*` | Pré-produção | Cópia do banco de produção (ramo do Neon) |
| `develop`, `feature/*` | Desenvolvimento | Banco de teste com dados fictícios |

- Funcionalidade nova: `git flow feature start <nome>` a partir de `develop`; volta por pull request.
- Nova versão: `git flow release start <versão>`, validação em pré-produção, depois `git flow release finish`, que leva a versão para `main` e `develop`.
- Correção urgente: `git flow hotfix start <nome>` a partir de `main`.

A cópia de produção usada em pré-produção tem dados pessoais e segue as mesmas regras de acesso da produção.
