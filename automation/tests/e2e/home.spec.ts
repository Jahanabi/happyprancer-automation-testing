import { test, expect } from '../../fixtures/base.fixture';

test.describe('Public - Home & Landing Module [Regression]', () => {
  test('TC-HOME-REG-001: Verify home page loads with navigation bar and branding', async ({
    homePage,
    page,
  }) => {
    await homePage.goto();
    await homePage.expectHomeLoaded();
  });

  test('TC-HOME-REG-002: Verify clicking login in navigation routes to /login', async ({
    homePage,
    page,
  }) => {
    await homePage.goto();
    if (await homePage.loginNavButton.isVisible()) {
      await homePage.clickLogin();
      await page.waitForURL(/.*login.*/, { timeout: 10000 });

    }
  });
});
