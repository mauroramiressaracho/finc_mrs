# Comprometido

Aplicação pessoal para acompanhar parcelas de cartões de crédito e visualizar o comprometimento financeiro futuro.

## Funcionalidades

- Cadastro de cartões.
- Cadastro de compras parceladas já em andamento, por exemplo `3/10`.
- Geração automática das parcelas anteriores, atual e futuras.
- Projeção do comprometimento mensal.
- Identificação das compras que terminam primeiro.
- Saldo futuro por cartão.
- Exportação e importação de backup em JSON.
- Persistência local no navegador via `localStorage`.

## GitHub Pages

O projeto é estático e pode ser publicado diretamente pelo GitHub Pages a partir da branch `main` e pasta raiz (`/`).

## Observação sobre os dados

O GitHub Pages não possui backend para alterar arquivos JSON no repositório durante o uso. Por isso, os dados pessoais ficam armazenados somente no navegador e podem ser exportados para um arquivo JSON de backup.

## Teste da regra de parcelas

Execute localmente:

```bash
node test-logic.js
```
