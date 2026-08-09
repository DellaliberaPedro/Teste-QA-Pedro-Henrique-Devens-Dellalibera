# Testes automatizados - NF-e com produto de grade

Testes de ponta a ponta em Playwright.
Ambiente: https://eweb-1383.staging.zweb.com.br

## O que cada teste faz

1. Cadastra um produto com grade (cor e tamanho), emite a NF-e,
   transmite e confere que a grade aparece no XML.
2. Cadastra o produto pelo botão "+" dentro da própria NF-e, com a
   grade e o preço zerado, e informa o valor na hora da venda. Confere
   que o item aparece com a grade no carrinho, mas que ela some do XML
   depois de transmitir. Esse teste passa enquanto o erro existir.
3. Emite uma nota e cancela, conferindo o status na listagem.

## Como rodar

    npm install
    npx playwright install

Crie um arquivo .env na raiz, no formato do .env.example:

    TEST_EMAIL=seu@email
    TEST_PASSWORD=sua-senha

Depois:

    npx playwright test                      # os 3 navegadores
    npx playwright test --project=chromium   # só o chromium
    npx playwright test --ui                 # acompanhando na tela

## Antes de rodar

Cada execução emite notas fiscais de verdade no ambiente de
homologação e cadastra produtos novos. Nos 3 navegadores são 9 notas
por rodada.

Os testes rodam em série, um de cada vez. Todos usam a mesma conta e
criam produtos com o mesmo nome, então em paralelo um mexe no registro
que o outro criou.

