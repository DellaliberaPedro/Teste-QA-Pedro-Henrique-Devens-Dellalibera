import { expect, Page } from '@playwright/test';

export const URL_LOGIN = 'https://eweb-1383.staging.zweb.com.br/#/sign-in';

export async function dispensarPreferenciasELayout(page: Page) {
  await page.addLocatorHandler(
    page.locator('#z_app_layout_builder.drawer-on'),
    async () => {
      await page.locator('#z_app_layout_builder_close').click();
    },
  );
}

export async function entrar(page: Page) {
  await page.goto(URL_LOGIN);
  await page.getByRole('textbox', { name: 'E-mail' }).fill(process.env.TEST_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 60000 });
}

export async function selecionarNoCombo(
  page: Page,
  campoId: string,
  textoBusca: string,
  opcao: string,
) {
  const campo = page.locator('.multiselect', { has: page.locator(`[id="${campoId}"]`) });
  await campo.locator(`[id="${campoId}"]`).fill(textoBusca);
  await campo.getByRole('option', { name: opcao }).first().click();
}

export async function esperarNatureza(page: Page) {
  const natureza = page.getByRole('button', { name: /^Natureza/ });
  await expect(async () => {
    if ((await natureza.textContent())?.includes('Venda')) return;
    await page.reload();
    await expect(natureza).toContainText('Venda', { timeout: 15000 });
  }).toPass({ timeout: 90000 });
}

export async function transmitirNota(page: Page) {
  const botao = page.locator('#z_app_content_container').getByRole('button', { name: 'Transmitir' });
  const modal = page.locator('#modal-wrapper');

  await expect(async () => {
    await botao.click();
    await expect(modal).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 60000 });

  await modal.getByRole('button', { name: 'Transmitir' }).click();
  await expect(page.getByText('Nota transmitida com sucesso.')).toBeVisible({ timeout: 90000 });
  await expect(page).toHaveURL(/fiscal\/nfe$/, { timeout: 30000 });
}

export async function lerXmlDaNota(page: Page) {
  const notaRow = page.locator('.table-row').filter({ hasText: 'Zucchetti' }).first();
  await notaRow.click({ button: 'right' });

  const xmlPagePromise = page.waitForEvent('popup');
  await page.locator('#menuId a').filter({ hasText: 'Gerar XML' }).click();
  const xmlPage = await xmlPagePromise;
  await xmlPage.waitForLoadState();

  return (await page.request.get(xmlPage.url())).text();
}
