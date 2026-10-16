# Protótipos do MVP (M0)

Protótipo navegável das 16 telas do MVP, feito com os componentes do Quasar 2.16.9 (Vue 3.4.38) carregados por CDN. Segue o [mapa de telas](../docs/prototipos/mapa-de-telas.md).

- **Ver online:** [Suricate Finance Protótipos](https://claude.ai/artifact/F4UQid2qyArpUT2cy19cPu) (página privada do Phelipe).
- **Ver no computador:** na pasta `prototipos/`, rode `python -m http.server 8765` e abra `http://127.0.0.1:8765/`.

## Como usar

- **Telas (barra lateral):** T01 a T16. As telas de formulário (T06, T09, T11) abrem por cima da tela de origem.
- **Fluxos:** F1 a F5, passo a passo, conforme a seção 4 do mapa de telas.
- **Ver:** lado a lado, só celular (360 px) ou só desktop (1440 px, reduzido para caber).
- **Tema:** claro ou escuro.

Os dois aparelhos mostram o mesmo estado: responder ao Suri no celular também avança a conversa no desktop. Nada é salvo e os dados são fictícios.

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Moldura dos protótipos, estado, dados fictícios, regras do cartão e o aparelho (layout do Quasar) |
| `screens.js` | As telas T01 a T16 |
