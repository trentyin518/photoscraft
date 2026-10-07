import { expect, test } from '@playwright/test';
import {
  cleanupE2EUsers,
  loginByForm,
  registerE2EUser,
} from '../fixtures/auth';

test.describe('settings API keys', () => {
  test.beforeAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test('creates, verifies, and revokes an API key', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);
    const keyName = `E2E key ${Date.now().toString().slice(-6)}`;

    await loginByForm(page, user);
    await page.goto('/settings/apikeys');
    await page.getByTestId('api-key-create-trigger').click();
    await page.getByTestId('api-key-name-input').fill(keyName);
    await page.getByTestId('api-key-create-submit').click();

    const newKeyDialog = page.getByTestId('api-key-secret-dialog');
    await expect(newKeyDialog).toBeVisible();
    const key = await page.getByTestId('api-key-secret-value').inputValue();
    expect(key).not.toBe('');

    const validResponse = await request.post('/api/test/apikey', {
      data: { key },
    });
    await expect(validResponse).toBeOK();
    expect(await validResponse.json()).toMatchObject({ valid: true });

    await page.getByTestId('api-key-secret-done').click();
    const keyRow = page.locator(`[data-key-name="${keyName}"]`);
    await expect(keyRow).toBeVisible();
    const keyId = await keyRow.getAttribute('data-key-id');
    expect(keyId).not.toBeNull();
    await page.getByTestId(`api-key-actions-${keyId}`).click();
    await page.getByTestId(`api-key-delete-${keyId}`).click();
    await expect(keyRow).toHaveCount(0);

    const revokedResponse = await request.post('/api/test/apikey', {
      data: { key },
    });
    await expect(revokedResponse).toBeOK();
    expect(await revokedResponse.json()).toMatchObject({ valid: false });
  });
});
