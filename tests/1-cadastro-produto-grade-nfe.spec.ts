import { test, expect } from '@playwright/test';
import {
  dispensarPreferenciasELayout,
  entrar,
  esperarNatureza,
  lerXmlDaNota,
  selecionarNoCombo,
  transmitirNota,
} from './support/zweb';

test('Teste Grade NF-e Emissão Simples', async ({ page }) => {
  test.setTimeout(180_000);

  await dispensarPreferenciasELayout(page);

  await entrar(page);

  const headerNav = page.locator('#z_app_header_wrapper');
  await headerNav.getByText('Cadastros', { exact: true }).click();
  await headerNav.getByText('Estoque', { exact: true }).click();
  await page.getByRole('link', { name: 'Produtos' }).first().click();

  await page.locator('.grid-toolbar-hidden-mobile')
    .getByRole('link', { name: 'Cadastrar produto' }).click();

  await page.getByRole('textbox', { name: 'Descrição*' }).fill('produto 1');
  await page.locator('[id="product.hasVariations"]').check();

  await page.getByRole('button', { name: 'Dados fiscais' }).click();

  await selecionarNoCombo(page, 'product.fiscal.produto.origem', '0 - Nacional', '0 - Nacional');
  await selecionarNoCombo(page, 'product.fiscal.produto.CST', '00', '00 - Tributada integralmente');
  await selecionarNoCombo(page, 'product.fiscal.produto.CSTNaoContribuinte', '00', '00 - Tributada integralmente');
  await selecionarNoCombo(page, 'product.fiscal.produto.CFOPNFE', '5102', '5102 - Venda de mercadoria');
  await selecionarNoCombo(page, 'product.fiscal.produto.CFOPNFCE', '5102', '5102 - Venda de mercadoria');

  await selecionarNoCombo(page, 'product.fiscal.produto.NCM', '61091000', '61091000');

  await page.getByRole('button', { name: 'Reforma tributária' }).click();
  await selecionarNoCombo(page, 'classTribIBSCBS', '000001', '000001');

  await page.getByRole('button', { name: 'Grade' }).click();
  await page.locator('[id="variation.color"]').fill('Verde');
  await page.locator('[id="variation.color"]').press('ArrowDown');
  await page.locator('[id="variation.color"]').press('Enter');
  await page.locator('[id="variation.size"]').fill('M');
  await page.locator('[id="variation.size"]').press('ArrowDown');
  await page.locator('[id="variation.size"]').press('Enter');

  await expect(page.getByText('Cor Verde / Tamanho M')).toBeVisible();

  await page.locator('#z_app_content_container').getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Atualizado com sucesso!')).toBeVisible({ timeout: 30000 });

  await headerNav.getByText('Fiscal', { exact: true }).click();
  await page.getByRole('link', { name: 'NF-e' }).click();
  await page.locator('.grid-toolbar-hidden-mobile')
    .getByRole('link', { name: 'Cadastrar NF-e' }).click();

  await esperarNatureza(page);

  await page.getByRole('button', { name: 'Destinatário' }).click();
  const clienteSearchBox = page.getByLabel('Destinatário').getByRole('textbox', { name: '-searchbox' });
  await clienteSearchBox.fill('Zucchetti');
  await page.getByRole('option', { name: 'Zucchetti' }).click();

  await page.getByRole('button', { name: 'Itens' }).click();
  const itemSearchBox = page.getByLabel('Itens').getByRole('textbox', { name: '-searchbox' });

  const linhaDoItem = page.locator('.row').filter({ has: page.locator('#quantity') }).last();
  const tituloItens = page.getByRole('button', { name: /^Itens/ });

  await expect(async () => {
    if ((await tituloItens.textContent())?.includes('R$ 10,00')) return;

    await itemSearchBox.fill('produto 1');
    await page.getByRole('option', { name: 'produto 1' }).first().click();

    await expect(page.getByRole('textbox', { name: 'Quantidade' })).toBeEnabled();
    await page.waitForTimeout(1500);

    const valorUnitario = page.getByRole('textbox', { name: 'Valor unitário R$' });
    await valorUnitario.click({ clickCount: 3 });
    await valorUnitario.pressSequentially('10,00');
    await expect(valorUnitario).toHaveValue('10,00');

    await expect(linhaDoItem.getByRole('textbox', { name: 'Total R$' })).toHaveValue('10,00');

    await linhaDoItem.locator('button:has(#icon-add)').click();

    await expect(tituloItens).toContainText('R$ 10,00', { timeout: 5000 });
  }).toPass({ timeout: 90000 });

  await transmitirNota(page);
  const notaRow = page.locator('.table-row').filter({ hasText: 'Zucchetti' }).first();

  await notaRow.click({ button: 'right' });
  const danfePagePromise = page.waitForEvent('popup');
  await page.locator('#menuId a').filter({ hasText: 'Visualizar DANFE' }).click();
  await danfePagePromise;

  const xml = await lerXmlDaNota(page);
  expect(xml).toMatch(/Verde/i);
});
