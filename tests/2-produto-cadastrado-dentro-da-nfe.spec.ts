import { test, expect } from '@playwright/test';
import {
  dispensarPreferenciasELayout,
  entrar,
  esperarNatureza,
  lerXmlDaNota,
  selecionarNoCombo,
  transmitirNota,
} from './support/zweb';

test('Erro emissão cadastro de produto dentro da nota', async ({ page }) => {
  test.setTimeout(240_000);

  await dispensarPreferenciasELayout(page);

  await entrar(page);

  const headerNav = page.locator('#z_app_header_wrapper');
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
  await page.locator('.z-select-item a.btn-select-action').click();
  await page.getByRole('button', { name: 'Produtos' }).click();

  const modal = page.locator('#modal-wrapper');
  await expect(modal.getByText('Cadastrar produto')).toBeVisible({ timeout: 30000 });

  await modal.getByRole('textbox', { name: 'Descrição*' }).fill('produto 2');
  await page.locator('[id="product.hasVariations"]').check();

  await modal.getByRole('tab', { name: 'Grade' }).click();

  await selecionarNoCombo(page, 'variation.color', 'Verde', 'Verde');
  await selecionarNoCombo(page, 'variation.size', 'M', 'M');

  await modal.locator('button:has(#icon-add)').click();
  await expect(modal.getByText('Cor Verde / Tamanho M')).toBeVisible({ timeout: 15000 });

  await modal.getByRole('tab', { name: 'Fiscal' }).click();
  await selecionarNoCombo(page, 'product.fiscal.produto.origem', '0 - Nacional', '0 - Nacional');
  await selecionarNoCombo(page, 'product.fiscal.produto.CST', '00', '00 - Tributada integralmente');
  await selecionarNoCombo(page, 'product.fiscal.produto.CSTNaoContribuinte', '00', '00 - Tributada integralmente');
  await selecionarNoCombo(page, 'product.fiscal.produto.NCM', '61091000', '61091000');

  await modal.getByRole('tab', { name: 'Reforma tributária' }).click();
  await selecionarNoCombo(page, 'classTribIBSCBS', '000001', '000001');

  await expect(async () => {
    if (!(await modal.isVisible())) return;
    await modal.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Atualizado com sucesso!')).toBeVisible({ timeout: 10000 });
  }).toPass({ timeout: 60000 });

  const linhaDoItem = page.locator('.row').filter({ has: page.locator('#quantity') }).last();
  const tituloItens = page.getByRole('button', { name: /^Itens/ });

  await expect(linhaDoItem.locator('.multiselect__single')).toContainText('produto 2');
  await expect(page.getByRole('textbox', { name: 'Quantidade' })).toBeEnabled();
  await page.waitForTimeout(3000);

  const valorUnitario = page.getByRole('textbox', { name: 'Valor unitário R$' });
  await valorUnitario.click({ clickCount: 3 });
  await valorUnitario.pressSequentially('30,00');
  await expect(valorUnitario).toHaveValue('30,00');

  await expect(linhaDoItem.getByRole('textbox', { name: 'Total R$' })).toHaveValue('30,00');

  await linhaDoItem.locator('button:has(#icon-add)').click();
  await expect(tituloItens).toContainText('R$ 30,00', { timeout: 15000 });

  await expect(page.locator('#fiscalNFeItemsData'))
    .toContainText('produto 2 - Cor Verde / Tamanho M');

  await transmitirNota(page);
  const xml = await lerXmlDaNota(page);
  expect(xml).toContain('<xProd>produto 2</xProd>');
  expect(xml).not.toContain('Cor Verde');
  expect(xml).not.toContain('Tamanho M');
});
