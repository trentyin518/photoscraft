import { expect, test } from '@playwright/test';
import {
  cleanupE2EUsers,
  loginByForm,
  registerE2EUser,
  updateE2EUser,
} from '../fixtures/auth';
import { createE2EUser } from '../fixtures/test-data';

test.describe('authentication and protected routes', () => {
  test.beforeAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test('redirects guests from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('allows a verified user to sign in and view dashboard', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);

    await loginByForm(page, user);
    await expect(page.getByTestId('dashboard-overview')).toBeVisible();
  });

  test('allows a user to register from the register page', async ({
    page,
    request,
  }) => {
    const user = createE2EUser();

    await page.goto('/auth/register');
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(nameInput).toBeVisible();
    await nameInput.fill(user.name);
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    await page.getByTestId('auth-register-submit').click();

    await updateE2EUser(request, {
      email: user.email,
      emailVerified: true,
      role: 'user',
    });
    await loginByForm(page, user);
    await expect(page.getByTestId('dashboard-overview')).toBeVisible();
  });

  test('denies the admin users dashboard to a signed-in non-admin', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);

    await loginByForm(page, user);
    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/admin\/users\/?$/);
    await expect(page.getByTestId('not-found-page')).toBeVisible();
    await expect(page.locator('a[href="/admin/users"]')).toHaveCount(0);
  });

  test('allows a credential user to change their password', async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    const user = await registerE2EUser(request);
    const newPassword = 'UpdatedPassword123456!';

    await loginByForm(page, user);
    await page.goto('/settings/security');
    const passwordForm = page.getByTestId('security-password-form');
    await expect(passwordForm).toBeVisible();
    await passwordForm
      .locator('input[name="currentPassword"]')
      .fill(user.password);
    await passwordForm.locator('input[name="newPassword"]').fill(newPassword);
    await passwordForm.locator('button[type="submit"]').click();
    await expect(
      passwordForm.locator('input[name="currentPassword"]')
    ).toHaveValue('');

    await page.context().clearCookies();
    await loginByForm(page, { ...user, password: newPassword });
    await expect(page.getByTestId('dashboard-overview')).toBeVisible();
  });
});
