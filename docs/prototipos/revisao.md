# M0 · Revisão dos protótipos

Os protótipos cobrem 21 dos 23 requisitos do MVP: o RF02 é regra de back-end e o RF06 ficou sem tela. Das 31 regras de negócio, 19 estão cobertas, 4 em parte, 1 (RN04) não está, e 7 são da Fase 2 ou 3. A revisão encontrou 5 problemas, todos corrigidos neste PR, e deixa 3 pontos para decisão.

Revisão feita em 16/10/2026 no Chrome, nas larguras de celular (360 px) e desktop (1440 px), nos temas claro e escuro, sobre a versão aprovada no PR #97.

## 1. Método

1. Abrir cada tela T01–T16 nas duas larguras e nos dois temas.
2. Percorrer os fluxos F1–F5 do início ao fim.
3. Conferir cada requisito do MVP (RF) contra as telas.
4. Conferir cada regra de negócio (RN) contra o comportamento do protótipo.
5. Conferir se os números fictícios batem entre as telas.
6. Comparar com o dia a dia real do usuário 1 (ciclo de 15 a 14, conta familiar, Nubank fechando dia 17).

## 2. Problemas encontrados e corrigidos

| # | Tela | Problema | Correção |
| --- | --- | --- | --- |
| 1 | T07 | O cartão Inter da família mostrava R$ 0,00 de compras no período, mas a T12 mostrava R$ 612,40 na fatura aberta | Compras do período do Inter passam a R$ 612,40 |
| 2 | T06 (celular) | As 4 abas do novo lançamento estouravam a largura e cortavam o botão "Salvar" | Abas mais compactas, com setas quando não couberem |
| 3 | T05 | O cartão "Resultado do período" (R$ 3.804,89) podia ser confundido com o disponível do painel (R$ 166,00) | Rótulo trocado para "Entradas menos saídas" |
| 4 | T08 | A fatura ideal (RN21) aparecia sem explicação | Novo bloco "Como a fatura ideal é calculada", com a conta aberta |
| 5 | T03 | O cadastro guiado não perguntava por parcelas e financiamentos em andamento (carro, parcelas do cartão), então a sobra estimada saía irreal | Nova seção "Parcelas e financiamentos em andamento" na etapa Contas fixas; as parcelas entram na prévia e podem ser divididas com a família |

## 3. Cobertura dos requisitos do MVP

| Requisito | Telas | Situação |
| --- | --- | --- |
| RF01 Cadastro e login (e-mail e Google) | T01, T02 | Coberto |
| RF02 Cada usuário vê só os próprios dados | — | Regra de back-end; sem tela própria |
| RF03 Cadastro guiado do Suri, com progresso e conquistas | T03 | Coberto |
| RF04 Retomar e refazer etapas | T03, T16 | Coberto |
| RF05 Períodos pela renda principal, com datas completas | T03, todas as telas internas | Coberto |
| RF06 Ajustar o período quando a renda entra em outra data | — | Não coberto (ponto em aberto A) |
| RF07 Navegar entre períodos | Seletor do topo | Coberto |
| RF08 Contas com saldo inicial e tipo | T03, T10, T11 | Coberto |
| RF09 Lançamentos com status pago/pendente | T05, T06, T15 | Coberto |
| RF10 Categorias e subcategorias | T06, T14 | Coberto (formulário de categoria não desenhado) |
| RF11 "Não pode atrasar" e mover de período | T03, T06, T15 | Coberto |
| RF13 Cadastro de cartão | T03, T09 | Coberto |
| RF14 Compra com data real e aviso de fatura | T06 | Coberto |
| RF15 Visões "gasto" e "caixa" | T07 | Coberto |
| RF16 Parceladas, uma parcela por fatura | T06, T08 | Coberto |
| RF18 Conta familiar com cartão do casal | T03, T12 | Coberto |
| RF19 Status paga/a pagar e repassada/a receber | T12 | Coberto |
| RF21 Planejamento por período | T13 | Coberto (exceções só como exemplo) |
| RF22 Limites de cartão e débito/Pix | T03, T04, T13 | Coberto |
| RF23 Painel do período | T04 | Coberto |
| RF31 Disponível e quanto ainda dá para gastar | T04 | Coberto |
| RF32 Fatura ideal e compras sugeridas | T04, T08 | Coberto |
| RF36 Transferência para a família vira comprometido | T06, T10, T12 | Coberto |

## 4. Regras de negócio

| Regra | Situação nos protótipos |
| --- | --- |
| RN01 Período pela renda | Coberta: o período segue o dia do salário informado no cadastro |
| RN02 Nome do mês de início e datas completas | Coberta em todas as telas |
| RN03 Regra de fim de semana | Coberta no cadastro (T03) e nas configurações (T16) |
| RN04 Renda em data diferente | **Não coberta** (ponto em aberto A) |
| RN05 Rendas secundárias no período | Coberta: aluguel de 08/11 aparece como "a receber" no painel |
| RN06 Conta no período em que vence; mover de período | Coberta (T15) |
| RN07 Contas que não podem atrasar | Coberta com o selo; o aviso antecipado é da Fase 2 (RF26) |
| RN08 Data real e fatura calculada | Coberta (T06) |
| RN09 Visão "gasto" nos limites | Coberta (T07, T13) |
| RN10 Visão "caixa" no saldo | Coberta (T07) |
| RN11 Aviso de compra antes do fechamento | Coberta (T06, com data entre 15 e 16) |
| RN12 Cada parcela no período da sua fatura | Coberta (T06, T08) |
| RN13 Participantes e percentuais | Coberta (T03, T12) |
| RN14 Dois status no rateio | Coberta (T12) |
| RN15 Quanto cada um transfere | Parcial: T12 mostra as partes; o cálculo automático é da Fase 2 (RF20) |
| RN16 Limites que se repetem, com exceções | Parcial: botões de copiar e de exceção só mostram um exemplo |
| RN17 / RN20 Disponível do período | Coberta, com a conta aberta no painel |
| RN18 Sobra em cascata para as metas | Parcial: o painel reserva R$ 600 para as metas; o plano é da Fase 2 |
| RN19 Pagar em qualquer dia do período | Coberta (T15, T12) |
| RN21 Fatura ideal | Coberta, agora com a conta aberta (T08) |
| RN22 Alerta de ritmo de gasto | Parcial: dica do Suri no painel; o alerta é da Fase 2 (RF33) |
| RN23–RN25 Metas inteligentes | Fase 2 (issue #96) |
| RN26 Transferência vira comprometido | Coberta (T06, T10, T12) |
| RN27 Saldo da conta familiar | Coberta (T12) |
| RN28–RN30 Perfil de membro | Fase 3 |
| RN31 Teste grátis e assinatura | Fase 3 |

## 5. Consistência dos números

Conferidos entre as telas, com os dados fictícios do usuário 1:

- **Disponível (T04):** R$ 1.240,00 + R$ 810,00 − R$ 1.284,00 − R$ 600,00 = **R$ 166,00**. As contas a pagar são a fatura Leroy (R$ 102,49), a fatura Nubank (R$ 1.081,51) e o celular (R$ 100,00).
- **Cartão no período (T04, T07, T13):** R$ 420,00 = restaurante, petshop, farmácia, lanche e cinema, todos depois de 17/10.
- **Fatura de 24/11 (T04, T08):** R$ 640,00 de parcelas + R$ 420,00 de compras novas = **R$ 1.060,00**; cabem mais R$ 580,00 até a fatura ideal de R$ 1.640,00.
- **Débito e Pix (T04, T13):** R$ 18,50 + R$ 115,50 = **R$ 134,00**.
- **Família (T04, T05, T12):** contas da casa de R$ 5.152,52; sua parte e a da Agatha, R$ 2.576,26 cada.

## 6. Comparação com o dia a dia do usuário 1

| Situação real | Como o protótipo responde |
| --- | --- |
| Recebe dia 15 e organiza o período inteiro | O período "Outubro · 15/10/2026 a 14/11/2026" aparece em todas as telas |
| Transfere a parte da casa para a conta familiar | T12 e T06: o valor vira comprometido na hora e sai do disponível |
| Paga contas antes do vencimento | T12 e T15: marcar como paga a qualquer momento do período |
| Quer saber quanto ainda pode gastar | T04: disponível de R$ 166,00 e R$ 580,00 de cartão |
| Compra no Nubank depois do dia 17 | T06: avisa que conta no limite deste período e é paga no próximo |
| Tem o carro e parcelas antigas | T03: agora entram no cadastro e na sobra estimada |
| Divide o cartão Inter com a Agatha | T07 e T12: cartão marcado como da família, com a sua parte |

## 7. Pontos em aberto para decisão

**Decisões registradas no PR #98:** A aprovada, para o M3 (issue #21). B aprovada, com o total e as já pagas; implementada neste PR. C aprovada: cada tela pendente é desenhada na documentação técnica do módulo que a implementa (#21, #29, #55).

- [x] **A. Salário que entra em outra data (RN04, RF06).** Proposta: no dia previsto, o Suri pergunta no painel "Seu salário já entrou?", com os botões "Entrou hoje" e "Ainda não". O período só vira quando o usuário confirma ou quando o lançamento do salário é marcado como recebido. Desenhar isso no M3 (Períodos)?
- [x] **B. Onboarding com parcelas e financiamentos.** A nova seção foi acrescentada na etapa Contas fixas. Aprovar aqui ou preferir uma etapa só para dívidas?
- [x] **C. Telas que ficaram sem desenho completo:** o formulário de categoria (T14), as exceções do planejamento (T13) e os detalhes dos períodos Setembro e Novembro (T04). Proposta: desenhar na etapa 1 (documentação técnica) de cada módulo correspondente, em vez de voltar ao M0.

## 8. Critérios de aceite do M0

- [x] Cada requisito do MVP aparece em pelo menos uma tela, exceto RF02 (back-end) e RF06 (ponto em aberto A).
- [x] As 16 telas existem em celular e desktop, nos temas claro e escuro.
- [x] Os 5 fluxos podem ser percorridos do início ao fim.
- [x] Valores, datas e períodos seguem os formatos do guia visual.
- [x] O seletor de período aparece em todas as telas internas, com datas completas.
