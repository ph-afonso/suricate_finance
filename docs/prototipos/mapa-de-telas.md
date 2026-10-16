# M0 · Documentação técnica dos protótipos

Este documento define o que os protótipos do MVP vão mostrar: as 16 telas, a navegação, os 5 fluxos principais, o guia visual e os componentes do Quasar usados em cada tela. Ele é a base da etapa 2 (desenvolvimento dos protótipos).

Referências: [Análise e Requisitos](https://claude.ai/code/artifact/383dc308-00c9-4c01-9659-85308904fd79) (RN01–RN31, RF01–RF45) e o inventário do Mobills feito em 16/10/2026.

## 1. Formato dos protótipos

- **Protótipo navegável em HTML**, feito com os próprios componentes do Quasar (Vue 3), carregados por CDN. O que for aprovado aqui é reaproveitado no código do M1 em diante.
- **Duas larguras:** celular (360 px) e desktop (1440 px). As telas são responsivas; os protótipos mostram as duas versões lado a lado.
- **Tema claro e escuro.**
- **Dados fictícios do "usuário 1"** (seção 7), com a mesma estrutura da vida financeira do Phelipe e valores inventados.
- **Sem back-end:** os botões navegam e abrem os diálogos, mas nada é salvo.
- Ficam em `prototipos/` no repositório, com um link para visualizar no navegador.

## 2. Navegação

O app tem 5 destinos principais. No celular eles ficam numa barra inferior; no desktop, numa barra lateral. O seletor de período fica sempre no topo.

| Destino | Celular | Desktop | Telas |
| --- | --- | --- | --- |
| Período (início) | Barra inferior, 1º ícone | Barra lateral | T04 |
| Lançamentos | Barra inferior, 2º ícone | Barra lateral | T05, T06, T15 |
| Novo lançamento | Botão central "+" (abre o menu: despesa, receita, compra no cartão, transferência) | Botão "+ Novo" no topo | T06 |
| Cartões | Barra inferior, 4º ícone | Barra lateral | T07, T08, T09 |
| Mais | Barra inferior, 5º ícone, abre a lista: Família, Planejamento, Contas, Categorias, Configurações | Itens próprios na barra lateral | T10–T14, T16 |

**Seletor de período (todas as telas, RF07):** `‹  Outubro · 15/10/2026 a 14/11/2026  ›`. As setas vão para o período anterior e o seguinte; tocar no nome abre a lista de períodos. O período atual tem a marca "atual".

## 3. Telas do MVP

| # | Tela | Requisitos | O que mostra | Celular | Desktop |
| --- | --- | --- | --- | --- | --- |
| T01 | Boas-vindas e login | RF01, RF02 | Suri de vigia, "Entrar com Google", e-mail e senha, link para cadastro | Tela cheia | Cartão central sobre fundo ilustrado |
| T02 | Cadastro | RF01 | Nome, e-mail, senha, aceite dos termos (LGPD) | Tela cheia | Cartão central |
| T03 | Onboarding do Suri | RF03, RF04 | Cadastro guiado em 7 etapas, cada uma uma tela com formulário: o usuário já cadastra renda, contas, cartões, contas fixas, família e metas, que aparecem como itens na tela. O Suri dá a dica de cada etapa; barra de progresso e conquistas | Uma etapa por tela, com "Continuar" no rodapé | Etapas à esquerda, formulário no centro e, à direita, a prévia do período, que se atualiza enquanto o usuário cadastra |
| T04 | Painel do período | RF23, RF31, RF32, RF07 | Disponível do período; cartão (gasto no período × limite, fatura ideal); débito/Pix × limite; próximas contas, com selo "não pode atrasar"; família (comprometido, a receber); dica do Suri | Cartões empilhados | Grade de 3 colunas com a dica do Suri fixa à direita |
| T05 | Lançamentos do período | RF09, RF07 | Lista agrupada por dia, filtros (tipo, conta, cartão, categoria, situação), totais do período | Lista com filtros em chips | Tabela com filtros na lateral |
| T06 | Novo lançamento | RF09, RF10, RF11, RF14, RF16, RF36 | Abas despesa/receita/cartão/transferência; valor, data, descrição, categoria, conta ou cartão, parcelas, "dividir com a família", "não pode atrasar". No cartão, o aviso "Cai na fatura de 24/11, paga no período Novembro" | Folha que sobe de baixo | Diálogo central |
| T07 | Cartões | RF13, RF15 | Um cartão por cartão de crédito, com alternância visão "gasto" / visão "caixa", limite usado e disponível | Lista de cartões | Grade de cartões |
| T08 | Fatura do cartão | RF15, RF16 | Compras da fatura com data real, parcelas "3/10", total, vencimento e o período que paga | Lista | Tabela com resumo à direita |
| T09 | Novo ou editar cartão | RF13 | Limite, nome, bandeira, conta de pagamento, dia de fechamento, dia de vencimento, compartilhado com a família | Folha que sobe de baixo | Diálogo |
| T10 | Contas | RF08, RF36 | Cada conta com saldo atual, comprometido e disponível; total no topo | Lista | Grade |
| T11 | Nova conta | RF08 | Saldo inicial, nome, banco, tipo (corrente, dinheiro, poupança, investimentos, VR/VA, familiar), cor | Folha | Diálogo |
| T12 | Família | RF18, RF19, RF36 | Conta familiar: contas da casa com "paga/a pagar", parte da Agatha "repassada/a receber", botão "Transferir minha parte", cartão do casal | Abas: Contas · Repasses · Cartão | Duas colunas: contas à esquerda, repasses e cartão à direita |
| T13 | Planejamento do período | RF21, RF22 | Limites de cartão e de débito/Pix; limite por categoria com barra de uso; copiar para os próximos períodos; exceções | Lista de categorias com barras | Tabela com colunas planejado, gasto e restante |
| T14 | Categorias | RF10 | Categorias e subcategorias com ícone e cor; criar, editar e arquivar | Lista em árvore | Tabela em árvore |
| T15 | Detalhe do lançamento | RF09, RF11 | Dados do lançamento, mover para outro período, marcar como pago, editar, excluir | Tela cheia | Painel lateral |
| T16 | Configurações | RF04 | Perfil, regras do período (dia do salário, fim de semana, atraso), refazer etapas do onboarding, tema claro/escuro | Lista | Página com abas |

Ficam fora do M0 (são Fase 2 e Fase 3): metas, alertas, importação, relatórios, calendário, membro da família e assinatura. Na Fase 2, a documentação e os protótipos serão complementados com essas telas (decisão da revisão do PR #95).

**Decisão da revisão do PR #98:** parcelas e financiamentos ficam na etapa Contas fixas. O usuário informa quantas parcelas eram e quantas já pagou; o app calcula quantas faltam e cria os lançamentos numerados a partir da próxima (ex.: 48 parcelas, 12 pagas → 13/48 a 48/48).

**Decisão da revisão do PR #97:** o onboarding deixa de ser uma conversa em chat e vira um cadastro guiado em telas, onde o usuário já cadastra contas, cartões e contas fixas.

**Decisões da revisão do PR #95:** cores e fontes aprovadas; barra inferior com 5 destinos aprovada, com Família e Planejamento dentro de "Mais" no celular; metas fora do M0.

## 4. Fluxos principais

**F1 · Primeiro acesso (RF01–RF05)**
1. T01 → "Entrar com Google".
2. T03, etapa 1: o Suri se apresenta; o usuário informa como quer ser chamado e escolhe o objetivo principal (opções + "Outros").
3. Etapa 2 (renda): campos "Dia" e "Valor médio"; opções para fim de semana (antecipa, adia, não muda, não sei); "Quantos dias atrasa?" só aparece se o usuário marcar que atrasa; outras entradas cadastradas na própria tela, com "Adicionar entrada".
4. Etapas 3 a 7: contas, cartões, contas fixas, família e objetivos, cadastrados na própria tela. Cada etapa concluída rende uma conquista, e no desktop a prévia do período (entradas, contas fixas, limites e sobra estimada) se atualiza a cada item.
5. Fechamento: o Suri mostra o período "Outubro · 15/10/2026 a 14/11/2026", o disponível e o próximo vencimento → T04.

**F2 · Lançar uma compra no cartão (RF14, RF16)**
1. T04 → "+" → "Compra no cartão".
2. T06: valor, data real da compra, cartão Nubank, 3 parcelas.
3. O app mostra: "1ª parcela na fatura de 24/11, paga no período Novembro; conta no limite de gasto do período Outubro".
4. Salvar → volta ao T04 com o limite do cartão atualizado e a dica do Suri recalculada.

**F3 · O ritual do salário (RN19, RN26)**
1. Início do período: o Suri avisa "Salário de R$ 7.500 entrou. Vamos organizar o período?".
2. T12 → "Transferir minha parte" para a conta familiar → o valor vira "comprometido" e sai do disponível na hora.
3. T04 → contas a pagar → marcar como pagas as que já foram pagas, antecipadas ou não.

**F4 · Quanto posso gastar? (RN20, RN21)**
1. T04: "Disponível do período: R$ 166" e "Cartão: R$ 420 de R$ 1.000 usados neste período".
2. Tocar em "Fatura ideal" → explicação: "Para bater as metas, a fatura de 24/11 (paga no período Novembro) deve fechar em até R$ 1.000. Ainda dá para gastar R$ 580 no cartão".

**F5 · Virar o período (RN04, RN24)**
1. No dia 15, o seletor passa para "Novembro · 15/11/2026 a 14/12/2026".
2. O Suri resume o período que fechou: quanto entrou, quanto saiu, o que sobrou e a comparação com o planejado.

## 5. Guia visual (proposta para aprovação)

**Personalidade:** amigável e bem-humorada, como o Suri, mas os números sempre claros e em destaque.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `primary` · Terra | `#A85A2A` | `#E08A55` | Botões principais, seleção, o Suri |
| `secondary` · Savana | `#2F5D50` | `#6FB3A0` | Barra de navegação, destaques secundários |
| `bg` · Areia | `#FBF7F2` | `#16130F` | Fundo das telas |
| `surface` | `#FFFFFF` | `#221D18` | Cartões e diálogos |
| `text` | `#1F1B16` | `#F2ECE4` | Texto principal |
| `text-muted` | `#6B6158` | `#B3A89C` | Texto secundário |
| `positive` | `#2E7D32` | `#66BB6A` | Receita, dentro do limite |
| `warning` | `#B26A00` | `#FFB74D` | Perto do limite, vence em breve |
| `negative` | `#C62828` | `#EF5350` | Despesa, limite estourado, atraso |
| `info` | `#1565C0` | `#64B5F6` | Avisos neutros |

O texto branco sobre `primary` e `secondary` passa no contraste AA (cerca de 5:1 e 7,5:1).

**Tipografia:**
- Títulos: Nunito (arredondada, combina com o Suri), 600 e 700.
- Textos e números: Inter; valores com algarismos de largura fixa (`tabular-nums`), para as colunas alinharem.
- Tamanhos: 28 / 22 / 18 / 16 (texto) / 14 (secundário) / 12 (legendas).

**Formatos:** valores `R$ 1.234,56`; datas `15/10/2026`; períodos `Outubro · 15/10/2026 a 14/11/2026`; parcelas `3/10`.

**Formas:** grade de 4 px; cartões com cantos de 12 px; botões de 8 px; sombras leves só nos cartões flutuantes.

**Ícones:** Material Symbols (padrão do Quasar), versão arredondada.

**O Suri:**
- Suricato em pé, em posição de vigia, em traço simples e cores `primary` e `secondary`.
- 4 expressões: de vigia (padrão), feliz (meta batida, conquista), preocupado (limite perto do fim), comemorando (período fechado no azul).
- Nos protótipos, o Suri é um desenho provisório; a ilustração final é uma tarefa à parte.
- Tom das mensagens: "Fatura fechando dia 17? Anotado. Suricato não esquece!" · "Opa, o cartão já está em 80% do limite deste período." · "Período fechado no azul! Sobraram R$ 674."

**Responsividade (breakpoints do Quasar):** `xs` < 600 e `sm` 600–1023 usam o layout de celular; `md` 1024–1439 e `lg` ≥ 1440 usam o layout de desktop.

**Acessibilidade:** contraste AA, área de toque mínima de 48 px, rótulos em todos os ícones, e cores nunca como única informação (o estouro de limite também tem texto).

## 6. Componentes do Quasar

| Componente | Onde |
| --- | --- |
| `QLayout`, `QHeader`, `QFooter`, `QDrawer` | Estrutura: barra inferior no celular, barra lateral no desktop |
| `QTabs`, `QRouteTab` | Barra de navegação inferior; abas da T12 e T16 |
| `QPageSticky` + `QFab` | Botão "+" de novo lançamento |
| `QCard`, `QCardSection` | Cartões do painel, contas e cartões de crédito |
| `QLinearProgress`, `QCircularProgress` | Uso do limite, progresso do onboarding |
| `QItem`, `QChip`, `QInput` | Listas e formulários do cadastro guiado (onboarding) |
| `QList`, `QItem`, `QItemLabel` | Listas de lançamentos, contas e categorias |
| `QTable` | Listas no desktop (T05, T08, T13, T14) |
| `QBtnToggle` | Visão "gasto" / "caixa" do cartão |
| `QDialog` (posição `bottom` no celular) | Formulários de novo lançamento, conta e cartão |
| `QInput` com máscara de moeda, `QSelect`, `QDate`, `QToggle`, `QOptionGroup` | Formulários |
| `QChip`, `QBadge` | Filtros, selo "não pode atrasar", parcelas |
| `QBanner` | Dica do Suri e avisos |
| `QSkeleton` | Carregamento |
| Plugins `Notify`, `Dark`, `BottomSheet` | Confirmações, tema escuro, menu do "+" |

## 7. Dados fictícios do usuário 1

| Item | Valor no protótipo |
| --- | --- |
| Salário | R$ 7.500, dia 15, antecipa no fim de semana |
| Outra renda | Aluguel R$ 810, dia 8 |
| Contas | Conta Pessoal R$ 1.240; Conta Familiar R$ 3.900 (comprometido) |
| Cartões | Nubank (fecha 17, vence 24, limite R$ 19.150); Leroy (vence 21); Inter da família (vence 20) |
| Limites do período | Cartão R$ 1.000; débito/Pix R$ 300 |
| Família | Participante "Agatha", 50/50; 8 contas da casa |
| Período atual | Outubro · 15/10/2026 a 14/11/2026 |

## 8. Critérios de aceite do M0

- Cada requisito do MVP (RF01–RF11, RF13–RF16, RF18, RF19, RF21–RF23, RF31, RF32, RF36) aparece em pelo menos uma tela.
- As 16 telas existem em celular (360 px) e desktop (1440 px), nos temas claro e escuro.
- Os 5 fluxos podem ser percorridos clicando, do início ao fim.
- Todo valor, data e período segue os formatos da seção 5.
- O seletor de período aparece em todas as telas internas e mostra datas completas.
