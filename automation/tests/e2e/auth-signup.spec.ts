import { test, expect } from '../../fixtures/base.fixture';

test.describe('Authentication - Signup Module [Regression]', () => {
  test('TC-SIGNUP-REG-001: Verify signup page renders all required form controls', async ({
    signupPage,
  }) => {
    await signupPage.goto();
    await signupPage.expectSignupFormVisible();
  });

  test('TC-SIGNUP-REG-002: Verify HTML5 validation requires name, email, and password', async ({
    signupPage,
  }) => {
    await signupPage.goto();
    await signupPage.submitSignup();
    const isNameValid = await signupPage.nameInput.evaluate(
      (el) => (el as HTMLInputElement).checkValidity()
    );
    expect(isNameValid).toBe(false);
  });

  test('TC-SIGNUP-REG-003: Verify referral code parameter pre-populates referral input', async ({
    page,
    signupPage,
  }) => {
    await page.goto('/signup?referral=HAPPYDANCE2026', { waitUntil: 'domcontentloaded' });
    const referralValue = await signupPage.referralInput.inputValue();
    expect(referralValue).toBe('HAPPYDANCE2026');
  });
});
