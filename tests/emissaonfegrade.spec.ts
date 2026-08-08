import { test, expect } from '@playwright/test';

// O grid de produtos desse sistema não é responsivo - elementos como o botao
// "Cadastrar produto" ficam fora da area visivel na resolucao padrao do
// Playwright (1280x720). Forcamos uma resolucao de desktop real pra evitar isso.
test.use({ viewport: { width: 1920, height: 1080 } });

test('cadastra produto com grade e emite NF-e', async ({ page }) => {
    // --- Login ---
    await page.goto('https://eweb-1383.staging.zweb.com.br/#/sign-in');
    await page.getByRole('textbox', { name: 'E-mail' }).fill(process.env.TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // --- Navegação até Cadastrar produto ---
    // "Cadastros" e "Estoque" não são links, são <span> que só abrem o menu ao
    // clicar/passar o mouse. O app renderiza esse menu duas vezes no HTML, por
    // isso escopamos a busca dentro de "#z_app_header_wrapper" (mesmo padrão que
    // o proprio app ja usa para o menu "Fiscal" mais abaixo).
    const headerNav = page.locator('#z_app_header_wrapper');
    await headerNav.getByText('Cadastros', { exact: true }).click();
    await headerNav.getByText('Estoque', { exact: true }).hover();
    await page.getByRole('link', { name: 'Produtos' }).first().click();
    await page.getByRole('link', { name: 'Cadastrar produto' }).first().click();

    // --- Dados gerais do produto ---
    await page.getByRole('textbox', { name: 'Descrição*' }).fill('Teste Produto Com grade');
    await page.locator('[id="product.hasVariations"]').check();

    // --- Dados fiscais ---
    await page.getByRole('button', { name: 'Dados fiscais' }).click();

    await page.getByRole('textbox', { name: 'fiscal.produto.origem-' }).fill('0');
    await page.getByRole('textbox', { name: 'fiscal.produto.origem-' }).press('Enter');

    await page.getByRole('textbox', { name: 'fiscal.produto.CST-searchbox' }).fill('00');
    await page.getByRole('textbox', { name: 'fiscal.produto.CST-searchbox' }).press('ArrowDown');
    await page.getByRole('textbox', { name: 'fiscal.produto.CST-searchbox' }).press('Enter');

    await page.getByRole('textbox', { name: 'fiscal.produto.CSTNaoContribuinte-searchbox' }).fill('00');
    await page.getByRole('textbox', { name: 'fiscal.produto.CSTNaoContribuinte-searchbox' }).press('ArrowDown');
    await page.getByRole('textbox', { name: 'fiscal.produto.CSTNaoContribuinte-searchbox' }).press('Enter');

    await page.locator('[id="product.fiscal.produto.CFOPNFE"]').fill('5102');
    await page.getByRole('button', { name: '5102', exact: true }).getByPlaceholder('Selecione um CFOP').press('ArrowDown');
    await page.getByRole('button', { name: '5102', exact: true }).getByPlaceholder('Selecione um CFOP').press('ArrowDown');
    await page.getByRole('button', { name: '5102', exact: true }).getByPlaceholder('Selecione um CFOP').press('Enter');

    await page.locator('[id="product.fiscal.produto.CFOPNFCE"]').fill('5102');
    await page.locator('[id="product.fiscal.produto.CFOPNFCE"]').press('Enter');

    await page.getByRole('textbox', { name: 'fiscal.produto.NCM-searchbox' }).fill('000000');
    await page.getByRole('textbox', { name: 'fiscal.produto.NCM-searchbox' }).press('Enter');

    await page.getByRole('button', { name: 'Reforma tributária' }).click();
    await page.locator('#classTribIBSCBS').press('ArrowDown');
    await page.locator('#classTribIBSCBS').press('Enter');

    // --- Grade (cor e tamanho) ---
    await page.getByRole('button', { name: 'Grade' }).click();
    await page.getByRole('button').filter({ hasText: 'VerdePretoAZUL-CLAROAzul' }).click();
    await page.locator('[id="variation.color"]').press('ArrowUp');
    await page.locator('[id="variation.color"]').press('Enter');
    await page.locator('[id="variation.size"]').press('Enter');

    await page.locator('#z_app_content_container').getByRole('button', { name: 'Salvar' }).click();

    // --- Emissão da NF-e ---
    await headerNav.getByText('Fiscal', { exact: true }).click();
    await page.getByRole('link', { name: 'NF-e' }).click();
    await page.getByRole('link', { name: 'Cadastrar NF-e' }).first().click();

    await page.getByRole('button').filter({ hasText: 'Venda de mercadoriaVenda de' }).click();
    await page.locator('#z-select-42083').press('ArrowDown');
    await page.locator('#z-select-42083').press('Enter');
    await page.getByRole('button', { name: 'Normal' }).getByLabel('-searchbox').press('Enter');
    await page.getByRole('button', { name: process.env.TEST_EMAIL! }).getByLabel('-searchbox').press('Enter');
    await page.getByRole('button', { name: 'Destinatário' }).click();
    await page.getByLabel('Destinatário').getByRole('textbox', { name: '-searchbox' }).press('Enter');

    await page.getByRole('button', { name: 'Itens R$' }).click();
    await page.getByLabel('Itens R$').getByRole('textbox', { name: '-searchbox' }).fill('teste');
    await page.getByLabel('Itens R$').getByRole('textbox', { name: '-searchbox' }).press('Enter');
    await page.getByRole('textbox', { name: 'Quantidade' }).press('Enter');
    await page.getByRole('textbox', { name: 'Valor unitário R$' }).fill('5,000');
    await page.getByRole('textbox', { name: 'Valor unitário R$' }).press('Enter');
    await page.getByRole('textbox', { name: 'Desconto' }).press('Enter');
    await page.locator('div').filter({ hasText: /^Produto para consumidor final$/ }).nth(2).click();

    await page.getByRole('button', { name: 'Transmitir' }).click();
    await page.locator('#modal-wrapper').getByRole('button', { name: 'Transmitir' }).click();

    // --- Confere DANFE e XML da nota transmitida ---
    await page.getByText('- Venda de mercadoria').first().click({ button: 'right' });
    const danfePagePromise = page.waitForEvent('popup');
    await page.locator('#menuId a').filter({ hasText: 'Visualizar DANFE' }).click();
    await danfePagePromise;

    await page.getByText('- Venda de mercadoria').first().click({ button: 'right' });
    const xmlPagePromise = page.waitForEvent('popup');
    await page.locator('#menuId a').filter({ hasText: 'Gerar XML' }).click();
    const xmlPage = await xmlPagePromise;

    // Verifica se a cor/tamanho da grade aparece no XML gerado (o bug documentado no relatório)
    await expect(xmlPage.locator('body')).toContainText(/Verde|Preto|Azul/i);
});
