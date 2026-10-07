import { expect, test } from '@playwright/test';
import {
  expectHealthyPage,
  installPageHealthMonitor,
  localizedPath,
  setTheme,
  type LocaleMode,
  type ThemeMode,
} from '../fixtures/page-health';

const publicPages = [
  { path: '/', name: 'home' },
  { path: '/pricing', name: 'pricing' },
  { path: '/blog', name: 'blog index' },
  { path: '/blog/what-is-fumadocs', name: 'blog detail' },
  { path: '/docs', name: 'docs index' },
  { path: '/ai', name: 'ai playground' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/changelog', name: 'changelog' },
  { path: '/roadmap', name: 'roadmap' },
  { path: '/waitlist', name: 'waitlist' },
  { path: '/cookie', name: 'cookie policy' },
  { path: '/privacy', name: 'privacy policy' },
  { path: '/terms', name: 'terms of service' },
  { path: '/auth/login', name: 'login' },
  { path: '/auth/register', name: 'register' },
  { path: '/auth/forgot-password', name: 'forgot password' },
  { path: '/auth/reset-password', name: 'reset password' },
] as const;

const smokeMatrix: Array<{ locale: LocaleMode; theme: ThemeMode }> = [
  { locale: 'en', theme: 'dark' },
  { locale: 'en', theme: 'light' },
  { locale: 'zh', theme: 'dark' },
  { locale: 'zh', theme: 'light' },
];

test.describe('public page smoke coverage', () => {
  for (const publicPage of publicPages) {
    for (const { locale, theme } of smokeMatrix) {
      test(`renders ${publicPage.name} in ${locale}/${theme}`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        const monitor = installPageHealthMonitor(page);

        await expectHealthyPage(
          page,
          monitor,
          localizedPath(publicPage.path, locale),
          { theme }
        );
      });
    }
  }

  test('opens the home page login modal', async ({ page }) => {
    await setTheme(page, 'dark');
    const monitor = installPageHealthMonitor(page);

    await expectHealthyPage(page, monitor, '/', { theme: 'dark' });
    await page.waitForLoadState('networkidle');
    await page.getByTestId('navbar-login-trigger').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[name="email"]')).toBeVisible();
    await expect(dialog.locator('input[name="password"]')).toBeVisible();
    monitor.expectNoErrors('home login modal');
  });

  test('health check responds with pong', async ({ request }) => {
    const response = await request.get('/api/ping');

    await expect(response).toBeOK();
    expect(await response.json()).toEqual({ message: 'pong' });
  });

  test('switches locale while preserving query, hash, and theme', async ({
    page,
  }) => {
    await setTheme(page, 'dark');
    const monitor = installPageHealthMonitor(page);

    await expectHealthyPage(page, monitor, '/?source=e2e#features', {
      theme: 'dark',
    });
    monitor.reset();

    await page.getByTestId('locale-switcher-trigger').click();
    await page.getByTestId('locale-switcher-option-zh').click();

    await expect(page).toHaveURL('/zh?source=e2e#features');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    monitor.expectNoErrors('home locale switch');
  });

  test('keeps docs sidebar controls in one compact row', async ({ page }) => {
    await page.goto('/docs');

    const sidebar = page.locator('#nd-sidebar');
    const twitter = sidebar.locator('a[href="https://mksaas.link/twitter"]');
    const github = sidebar.locator('a[href*="github.com/"]').first();
    const language = sidebar.getByTestId('locale-switcher-trigger');
    const theme = sidebar.getByTestId('mode-switcher-trigger');

    await expect(twitter).toBeVisible();
    await expect(github).toBeVisible();
    await expect(language).toBeVisible();
    await expect(theme).toBeVisible();

    const boxes = await Promise.all(
      [twitter, github, language, theme].map((control) => control.boundingBox())
    );
    expect(boxes.every(Boolean)).toBe(true);

    const [twitterBox, githubBox, languageBox, themeBox] = boxes;
    if (!twitterBox || !githubBox || !languageBox || !themeBox) return;

    for (const box of boxes) {
      if (box) expect(Math.abs(box.y - twitterBox.y)).toBeLessThan(2);
    }
    expect(twitterBox.x).toBeLessThan(githubBox.x);
    expect(githubBox.x).toBeLessThan(languageBox.x);
    expect(languageBox.x).toBeLessThan(themeBox.x);

    const socialGap = githubBox.x - (twitterBox.x + twitterBox.width);
    const controlGap = themeBox.x - (languageBox.x + languageBox.width);
    expect(Math.abs(socialGap - controlGap)).toBeLessThan(1);

    await expect(language).toHaveCSS('border-top-width', '1px');
    await expect(theme).toHaveCSS('border-top-width', '1px');
    for (const control of [language, theme]) {
      const radius = await control.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
      );
      expect(radius).toBeGreaterThanOrEqual(16);
    }
  });
});
