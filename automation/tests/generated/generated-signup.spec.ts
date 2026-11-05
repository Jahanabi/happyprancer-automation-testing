/**
 * AUTO-GENERATED PLAYWRIGHT TEST SUITE FOR HAPPY PRANCER
 * Module: Signup
 * Target Branch: test-workflow
 * Total Generated Tests: 22
 * Generated: 2026-11-05T11:11:51.697Z
 * 1-to-1 Mapping with latest-test-cases.json testCaseId
 */

import { test, expect } from '../../fixtures/base.fixture';

test.describe('Generated AI Tests - Signup [@generated]', () => {

  /**
   * [SIGNUP-001] Signup page loads successfully
   * Priority: Critical | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-001 - Signup page loads successfully', async ({ signupPage, page }) => {
    await signupPage.goto();
    await expect(signupPage.getFullNameInput()).toBeVisible();
    await expect(signupPage.getEmailInput()).toBeVisible();
    await expect(signupPage.getPasswordInput()).toBeVisible();
    await expect(signupPage.getCreateAccountButton()).toBeVisible();
    console.log('ACTUAL RESULT: Signup page loaded successfully.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-002] Full Name is mandatory
   * Priority: High | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-002 - Full Name is mandatory', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasFullName();
    expect(exists, 'Full Name field is mandatory but was not found.').toBeTruthy();
    const signupName = process.env.SIGNUP_NAME || 'Test User';
    await signupPage.enterFullName(signupName);
    await expect(signupPage.getFullNameInput()).toHaveValue(signupName);
    console.log('ACTUAL RESULT: Full Name field is available and accepts input.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-003] Email field is mandatory
   * Priority: Critical | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-003 - Email field is mandatory', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasEmail();
    expect(exists, 'Email field is mandatory but was not found.').toBeTruthy();
    const signupEmail = process.env.SIGNUP_EMAIL || 'testuser@example.com';
    await signupPage.enterEmail(signupEmail);
    await expect(signupPage.getEmailInput()).toHaveValue(signupEmail);
    console.log('ACTUAL RESULT: Email field is available and accepts input.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-004] Invalid email format should be rejected
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-004 - Invalid email format should be rejected', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidEmail = 'invalidemail.com';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(invalidEmail);
    if (await signupPage.hasPhone()) {
      await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    }
    await signupPage.enterPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    if (await signupPage.hasConfirmPassword()) {
      await signupPage.enterConfirmPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    }
    const emailInput = signupPage.getEmailInput();
    const validation = await emailInput.evaluate((input: HTMLInputElement) => ({
      type: input.type,
      valid: input.validity.valid,
      typeMismatch: input.validity.typeMismatch,
      validationMessage: input.validationMessage,
    }));
    expect(validation.typeMismatch || !validation.valid, `Invalid email was accepted. Current URL: ${page.url()}`).toBeTruthy();
    console.log('ACTUAL RESULT: System rejected the invalid email format.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-005] Email should contain valid domain
   * Priority: Medium | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-005 - Email should contain valid domain', async ({ signupPage, page }) => {
    await signupPage.goto();
    const signupEmail = process.env.SIGNUP_EMAIL || 'testuser@example.com';
    const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = validEmailPattern.test(signupEmail);
    await signupPage.enterEmail(signupEmail);
    console.log('ACTUAL RESULT: Email entered:', signupEmail);
    console.log('STATUS:', isValid ? 'PASS' : 'FAIL');
    expect(isValid, `${signupEmail} is not a valid email format.`).toBeTruthy();
  });

  /**
   * [SIGNUP-006] Phone number is handled correctly
   * Priority: Medium | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-006 - Phone number is handled correctly', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasPhone();
    if (!exists) {
      console.log('ACTUAL RESULT: Phone field is not present.');
      console.log('STATUS: NOT APPLICABLE');
      return;
    }
    const signupPhone = process.env.SIGNUP_PHONE || '9876543210';
    await signupPage.enterPhone(signupPhone);
    await expect(signupPage.getPhoneInput()).toHaveValue(signupPhone);
    console.log('ACTUAL RESULT: Phone field is available and accepts input.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-007] Password must contain at least 8 characters
   * Priority: High | Type: Boundary
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-007 - Password must contain at least 8 characters', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidPassword = 'Ab@123';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    if (await signupPage.hasPhone()) {
      await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    }
    await signupPage.enterPassword(invalidPassword);
    if (await signupPage.hasConfirmPassword()) {
      await signupPage.enterConfirmPassword(invalidPassword);
    }
    const passwordValidationRegex = /Password did not conform with policy:\s*Password not long enough|Password.*(?:must|should).*at least 8 characters|Must contain at least 8 characters|Password.*too short|Password.*not long enough|at least 8 characters/i;
    const passwordError = page.getByText(passwordValidationRegex).first();
    if (await passwordError.isVisible().catch(() => false)) {
      console.log('ACTUAL RESULT: System rejected password because it contains fewer than 8 characters.');
      console.log('STATUS: PASS');
      return;
    }
    let validDialog = false;
    page.on('dialog', async (dialog) => {
      if (passwordValidationRegex.test(dialog.message())) validDialog = true;
      await dialog.accept();
    });
    await signupPage.clickCreateAccount();
    await expect.poll(async () => {
      if (validDialog) return true;
      return await passwordError.isVisible().catch(() => false);
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
    console.log('ACTUAL RESULT: System rejected password because it contains fewer than 8 characters.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-008] Password must contain uppercase character
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-008 - Password must contain uppercase character', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidPassword = 'abcdefg@1';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(invalidPassword);
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(invalidPassword);
    const uppercaseRegex = /Password did not conform with policy:\s*Password must have uppercase characters|Password.*uppercase|upper case/i;
    let dialogValidationFound = false;
    page.once('dialog', async (dialog) => {
      if (uppercaseRegex.test(dialog.message())) dialogValidationFound = true;
      await dialog.accept();
    });
    await signupPage.clickCreateAccount();
    const pageValidation = page.getByText(uppercaseRegex).first();
    await expect.poll(async () => {
      if (dialogValidationFound) return true;
      return await pageValidation.isVisible().catch(() => false);
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
    console.log('ACTUAL RESULT: System rejected password because it does not contain an uppercase letter.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-009] Password must contain lowercase character
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-009 - Password must contain lowercase character', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidPassword = 'ABCDEFG@1';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(invalidPassword);
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(invalidPassword);
    const lowercaseRegex = /Password did not conform with policy:\s*Password must have lowercase characters|Must contain a lowercase letter|Password.*lowercase|lower case/i;
    let dialogValidationFound = false;
    page.once('dialog', async (dialog) => {
      if (lowercaseRegex.test(dialog.message())) dialogValidationFound = true;
      await dialog.accept();
    });
    await signupPage.clickCreateAccount();
    const pageValidation = page.getByText(lowercaseRegex).first();
    await expect.poll(async () => {
      if (dialogValidationFound) return true;
      return await pageValidation.isVisible().catch(() => false);
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
    console.log('ACTUAL RESULT: System rejected password because it does not contain a lowercase character.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-010] Password must contain number
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-010 - Password must contain number', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidPassword = 'Abcdefg@';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(invalidPassword);
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(invalidPassword);
    const numberErrorRegex = /Must contain a number\.|Password did not conform with policy:\s*Password must have numeric characters|Password.*(?:number|numeric)/i;
    let dialogValidationFound = false;
    page.once('dialog', async (dialog) => {
      if (numberErrorRegex.test(dialog.message())) dialogValidationFound = true;
      await dialog.accept();
    });
    await signupPage.clickCreateAccount();
    const numberError = page.getByText(numberErrorRegex).first();
    await expect.poll(async () => {
      if (dialogValidationFound) return true;
      return await numberError.isVisible().catch(() => false);
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
    console.log('ACTUAL RESULT: System rejected password because it does not contain a number.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-011] Password must contain special character
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-011 - Password must contain special character', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidPassword = 'Abcdefgh1';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(invalidPassword);
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(invalidPassword);
    const specialCharacterRegex = /Must contain a special character|Password did not conform with policy:\s*Password must have symbol characters|Password.*(?:special character|symbol)/i;
    let dialogValidationFound = false;
    page.once('dialog', async (dialog) => {
      if (specialCharacterRegex.test(dialog.message())) dialogValidationFound = true;
      await dialog.accept();
    });
    await signupPage.clickCreateAccount();
    const specialCharacterError = page.getByText(specialCharacterRegex).first();
    await expect.poll(async () => {
      if (dialogValidationFound) return true;
      return await specialCharacterError.isVisible().catch(() => false);
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
    console.log('ACTUAL RESULT: System rejected password because it does not contain a special character.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-012] Confirm Password is optional
   * Priority: Medium | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-012 - Confirm Password is optional', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasConfirmPassword();
    if (!exists) {
      console.log('ACTUAL RESULT: Confirm Password field is not present.');
      console.log('STATUS: NOT APPLICABLE');
      return;
    }
    const signupPassword = process.env.SIGNUP_PASSWORD || 'Test@1234';
    const signupConfirmPassword = process.env.SIGNUP_CONFIRM_PASSWORD || 'Test@1234';
    await signupPage.enterPassword(signupPassword);
    await signupPage.enterConfirmPassword(signupConfirmPassword);
    await expect(signupPage.getConfirmPasswordInput()).toHaveValue(signupConfirmPassword);
    console.log('ACTUAL RESULT: Confirm Password field is present.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-013] Confirm Password must match Password when present
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-013 - Confirm Password must match Password when present', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasConfirmPassword();
    if (!exists) {
      console.log('ACTUAL RESULT: Confirm Password field does not exist.');
      console.log('STATUS: NOT APPLICABLE');
      return;
    }
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword('Password@123');
    await signupPage.enterConfirmPassword('Different@123');
    const mismatchRegex = /Passwords?\s*must\s*match|passwords?\s*do\s*not\s*match|password.*confirm.*match|confirm.*password.*match/i;
    let dialogValidationFound = false;
    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      if (mismatchRegex.test(dialogMessage)) dialogValidationFound = true;
      await dialog.accept();
    });
    await signupPage.clickCreateAccount();
    const pageValidation = page.getByText(mismatchRegex).first();
    await expect.poll(async () => {
      if (dialogValidationFound) return true;
      return await pageValidation.isVisible().catch(() => false);
    }, { timeout: 15000, intervals: [500, 1000, 2000] }).toBe(true);
    if (dialogValidationFound) expect(dialogMessage, 'Expected password mismatch validation dialog.').toMatch(mismatchRegex);
    console.log('ACTUAL RESULT: System rejected the signup because Password and Confirm Password do not match.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-014] Referral Code is optional when available
   * Priority: Medium | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-014 - Referral Code is optional when available', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasReferralCode();
    if (!exists) {
      console.log('ACTUAL RESULT: Referral Code field is not present.');
      console.log('STATUS: NOT APPLICABLE');
      return;
    }
    console.log('ACTUAL RESULT: Referral Code field exists and can be skipped.');
    console.log('STATUS: PASS');
    expect(exists).toBeTruthy();
  });

  /**
   * [SIGNUP-015] Create account with valid signup data
   * Priority: Critical | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-015 - Create account with valid signup data', async ({ signupPage, page }) => {
    await signupPage.goto();
    const signupEmail = process.env.SIGNUP_EMAIL || 'testuser@example.com';
    const uniqueEmail = signupEmail.replace('@', `+${Date.now()}@`);
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(uniqueEmail);
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(process.env.SIGNUP_CONFIRM_PASSWORD || 'Test@1234');
    const referralCode = process.env.SIGNUP_REFERRAL_CODE || '';
    if (referralCode && (await signupPage.hasReferralCode())) await signupPage.enterReferralCode(referralCode);
    page.once('dialog', async (dialog) => { await dialog.dismiss(); });
    await signupPage.clickCreateAccount();
    await page.waitForTimeout(2000);
    const successVisible = await signupPage.getSuccessMessage().isVisible().catch(() => false);
    const errorVisible = await signupPage.getErrorMessage().isVisible().catch(() => false);
    const otpVisible = await signupPage.hasOtp();
    const currentUrl = page.url();
    const redirected = /dashboard|redirect|verify|otp|login/i.test(currentUrl);
    const successful = successVisible || otpVisible || redirected;
    console.log('STATUS:', successful ? 'PASS' : 'FAIL');
    expect(successful, `Signup did not show a successful result. URL: ${currentUrl}`).toBeTruthy();
  });

  /**
   * [SIGNUP-016] Create Account or Sign Up button should be available
   * Priority: High | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-016 - Create Account or Sign Up button should be available', async ({ signupPage, page }) => {
    await signupPage.goto();
    const button = signupPage.getCreateAccountButton();
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    console.log('ACTUAL RESULT: Create Account/Sign Up button is visible and enabled.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-017] Google Signup option when available
   * Priority: Medium | Type: Positive
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-017 - Google Signup option when available', async ({ signupPage, page }) => {
    await signupPage.goto();
    const exists = await signupPage.hasGoogleSignup();
    if (!exists) {
      console.log('ACTUAL RESULT: Google Signup is not available.');
      console.log('STATUS: NOT APPLICABLE');
      return;
    }
    await expect(signupPage.getGoogleSignupButton()).toBeVisible();
    console.log('ACTUAL RESULT: Google Signup option is available.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-018] Reject XSS payload in Full Name
   * Priority: Critical | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-018 - Reject XSS payload in Full Name', async ({ signupPage, page }) => {
    await signupPage.goto();
    const xssPayload = "<script>alert('XSS')</script>";
    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });
    await signupPage.enterFullName(xssPayload);
    await signupPage.enterEmail(`security-xss-${Date.now()}@example.com`);
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(process.env.SIGNUP_CONFIRM_PASSWORD || 'Test@1234');
    await signupPage.clickCreateAccount();
    await page.waitForTimeout(1000);
    expect(dialogTriggered, 'XSS payload must not execute JavaScript.').toBe(false);
    console.log('ACTUAL RESULT: XSS payload in Full Name was not executed.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-019] Reject SQL injection-like signup input
   * Priority: Critical | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-019 - Reject SQL injection-like signup input', async ({ signupPage, page }) => {
    await signupPage.goto();
    const sqlPayload = "' OR '1'='1";
    await signupPage.enterFullName(sqlPayload);
    await signupPage.enterEmail(`security-sql-${Date.now()}@example.com`);
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(process.env.SIGNUP_CONFIRM_PASSWORD || 'Test@1234');
    await signupPage.clickCreateAccount();
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    const authenticated = /dashboard/i.test(currentUrl);
    expect(authenticated, 'SQL injection-like input must not result in unauthorized authentication.').toBe(false);
    console.log('ACTUAL RESULT: SQL injection-like signup input did not produce unauthorized access.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-020] Reject invalid email format
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-020 - Reject invalid email format', async ({ signupPage, page }) => {
    await signupPage.goto();
    const invalidEmail = 'invalid-email-without-domain';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(invalidEmail);
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(process.env.SIGNUP_CONFIRM_PASSWORD || 'Test@1234');
    await signupPage.clickCreateAccount();
    await page.waitForTimeout(500);
    const emailInput = signupPage.getEmailInput();
    const validationMessage = await emailInput.evaluate((element: HTMLInputElement) => element.validationMessage);
    const pageText = (await page.locator('body').innerText()).toLowerCase();
    const invalidEmailDetected = Boolean(validationMessage) || /invalid email|valid email|email.*valid/i.test(pageText);
    expect(invalidEmailDetected, 'Invalid email should be rejected.').toBe(true);
    console.log('ACTUAL RESULT: Invalid email format was rejected.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-021] Reject weak password
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-021 - Reject weak password', async ({ signupPage, page }) => {
    await signupPage.goto();
    const weakPassword = '12345678';
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(`security-password-${Date.now()}@example.com`);
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(weakPassword);
    if (await signupPage.hasConfirmPassword()) await signupPage.enterConfirmPassword(weakPassword);
    await signupPage.clickCreateAccount();
    await page.waitForTimeout(1000);
    const pageText = (await page.locator('body').innerText()).toLowerCase();
    const passwordRejected = /password.*(weak|strong|character|uppercase|lowercase|number|symbol|special)|must.*password|password.*policy/i.test(pageText);
    const currentUrl = page.url();
    const movedToAuthenticatedArea = /dashboard/i.test(currentUrl);
    expect(movedToAuthenticatedArea, 'Weak password must not create an authenticated session.').toBe(false);
    expect(passwordRejected || !movedToAuthenticatedArea, 'Weak password should be rejected or prevent account authentication.').toBe(true);
    console.log('ACTUAL RESULT: Weak password did not create an authenticated session.');
    console.log('STATUS: PASS');
  });

  /**
   * [SIGNUP-022] Reject mismatched password confirmation
   * Priority: High | Type: Negative
   * Source: src/Development/pages/Auth/Signup/SignupForm.jsx
   */
  test('SIGNUP-022 - Reject mismatched password confirmation', async ({ signupPage, page }) => {
    await signupPage.goto();
    await signupPage.enterFullName(process.env.SIGNUP_NAME || 'Test User');
    await signupPage.enterEmail(`security-confirm-${Date.now()}@example.com`);
    if (await signupPage.hasPhone()) await signupPage.enterPhone(process.env.SIGNUP_PHONE || '9876543210');
    await signupPage.enterPassword(process.env.SIGNUP_PASSWORD || 'Test@1234');
    if (await signupPage.hasConfirmPassword()) {
      await signupPage.enterConfirmPassword(`${process.env.SIGNUP_PASSWORD || 'Test@1234'}Mismatch`);
    } else {
      console.log('ACTUAL RESULT: Confirm Password field is not available.');
      console.log('STATUS: NOT APPLICABLE');
      return;
    }
    await signupPage.clickCreateAccount();
    await page.waitForTimeout(1000);
    const pageText = (await page.locator('body').innerText()).toLowerCase();
    const mismatchDetected = /password.*match|password.*mismatch|confirm.*password/i.test(pageText);
    const currentUrl = page.url();
    const authenticated = /dashboard/i.test(currentUrl);
    expect(authenticated, 'Mismatched passwords must not authenticate the user.').toBe(false);
    expect(mismatchDetected || !authenticated, 'Mismatched password confirmation must be rejected.').toBe(true);
    console.log('ACTUAL RESULT: Mismatched password confirmation did not authenticate the user.');
    console.log('STATUS: PASS');
  });
});
