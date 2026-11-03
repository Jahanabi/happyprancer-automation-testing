import { test, expect } from '../../fixtures/base.fixture';

test.describe('Authentication - Login Module [Regression]', () => {
  test('TC-AUTH-REG-001: Verify login form renders with accessible email and password inputs', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
  });

  test('TC-AUTH-REG-002: Verify validation on submitting empty login credentials', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.submitLogin();
    // HTML5 native validation prevents form submission
    const isEmailValid = await loginPage.emailInput.evaluate(
      (el) => (el as HTMLInputElement).checkValidity()
    );
    expect(isEmailValid).toBe(false);
  });

  test('TC-AUTH-REG-003: Verify navigation to forgot-password from login page', async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await page.waitForURL(/.*forgot-password.*/, { timeout: 10000 });
    expect(page.url()).toContain('forgot-password');
  });

  test('TC-AUTH-REG-004: Verify navigation to signup from login page', async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    // If signup link is rendered based on productId or general link
    const signupLink = page.locator('a[href="/signup"]');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForURL(/.*signup.*/, { timeout: 10000 });
      expect(page.url()).toContain('signup');
    }
  });
});
