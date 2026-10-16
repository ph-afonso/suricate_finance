# Processo de trabalho

O trabalho é dividido em **milestones** (um módulo completo cada) e cada milestone tem **4 etapas**, feitas em ordem. Cada etapa é entregue pelo Claude em um pull request; **o merge do PR pelo Phelipe é a aprovação** e libera a próxima etapa.

Quadro: [Suricate Finance (GitHub Project)](https://github.com/users/ph-afonso/projects/2)

## Estrutura

| Nível | No GitHub | Exemplo |
| --- | --- | --- |
| Módulo | Milestone + issue com a label `modulo` | M3 · Períodos |
| Etapa | Sub-issue do módulo | [M3] 1. Documentação técnica |
| Tarefa | Sub-issue da etapa de desenvolvimento, uma por requisito | [M3] RF05 · Gerar períodos... |

As 4 etapas de todo módulo:

1. **Documentação técnica** (`etapa:doc-tecnica`): modelo de dados, endpoints, telas e casos de teste.
2. **Desenvolvimento** (`etapa:dev`): implementação, publicada no ambiente de desenvolvimento.
3. **Testes** (`etapa:teste`): testes automatizados e relatório de testes.
4. **Documentação de uso** (`etapa:doc-uso`): guia do usuário com prints.

Ordem dos módulos do MVP: M0 Protótipos → M1 Fundação → M2 Acesso e onboarding → M3 Períodos → M4 Contas e lançamentos → M5 Cartões → M6 Modo família → M7 Planejamento → M8 Consultor e painel. Os milestones "Fase 2" e "Fase 3" são backlog.

## Ciclo de uma etapa

1. A etapa recebe a label **`pronta-para-claude`** (coluna "Pronta para Claude").
2. O Phelipe pede ao Claude Code: **"próxima tarefa"**. O Claude pega a etapa liberada, move para "Em andamento" e trabalha em um ramo `feature/<modulo>-<etapa>`.
3. O Claude abre um PR para `develop` com `Closes #<etapa>` (e `Closes #<tarefa>` de cada tarefa entregue). A Action troca a label para **`aguardando-aprovacao`**.
4. O Phelipe revisa o PR:
   - **Aprovado:** clica em **Merge pull request**. A issue fecha, e a Action libera a próxima etapa.
   - **Precisa de ajustes:** comenta no PR. O Claude corrige no mesmo PR.
5. Ao aprovar a etapa 4, a Action fecha o módulo e o milestone e libera a etapa 1 do próximo módulo.

## Labels

| Label | Significado |
| --- | --- |
| `etapa:doc-tecnica`, `etapa:dev`, `etapa:teste`, `etapa:doc-uso` | Etapa do módulo |
| `modulo` | Issue principal do módulo |
| `tarefa` | Tarefa de um requisito |
| `pronta-para-claude` | Liberada para o Claude |
| `aguardando-aprovacao` | PR aberto, aguardando merge |
| `backlog`, `ideia-futura` | Fase 2/3 ou fora do escopo |
