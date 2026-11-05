import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Login Page Object Model
 * Fully supports reference tests LOGIN-001 through LOGIN-020
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;
  readonly googleSignInButton: Locator;
  readonly loginHeading: Locator;
  readonly roleSelector: Locator;
  readonly authenticationError: Locator;
  readonly emailValidationError: Locator;
  readonly passwordValidationError: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    this.continueButton = page.locator('button:has-text("Continue"), button[type="submit"]');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"], a:has-text("Forgot password?")');
    this.signupLink = page.locator('a[href="/signup"], a:has-text("Signup")');
    this.googleSignInButton = page.locator('button:has-text("Sign in with Google")');
    this.loginHeading = page.locator('text=Login').first();
    this.roleSelector = page.locator('[data-testid="role-selector"], #role-selector, select[name="role"]');
    this.authenticationError = page.locator('.Toastify__toast--error, [role="alert"], text=/incorrect password|account does not exist|not authorized/i');
    this.emailValidationError = page.locator('#login-email:invalid, .email-error, [data-testid="email-error"]');
    this.passwordValidationError = page.locator('#login-password:invalid, .password-error, [data-testid="password-error"]');
  }

  // Getters for LOGIN-001 to LOGIN-020
  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getGoogleSignInButton(): Locator {
    return this.googleSignInButton;
  }

  getForgotPasswordLink(): Locator {
    return this.forgotPasswordLink;
  }

  getLoginButton(): Locator {
    return this.continueButton;
  }

  getSignUpLink(): Locator {
    return this.signupLink;
  }

  getRoleSelector(): Locator {
    return this.roleSelector;
  }

  getAuthenticationError(): Locator {
    return this.authenticationError;
  }

  getEmailValidationError(): Locator {
    return this.emailValidationError;
  }

  getPasswordValidationError(): Locator {
    return this.passwordValidationError;
  }

  getPasswordNumberValidation(): Locator {
    return this.page.getByText(/number|numeric/i);
  }

  getPasswordUppercaseValidation(): Locator {
    return this.page.getByText(/uppercase|upper case/i);
  }

  getPasswordLowercaseValidation(): Locator {
    return this.page.getByText(/lowercase|lower case/i);
  }

  getPasswordSpecialCharacterValidation(): Locator {
    return this.page.getByText(/special character|symbol/i);
  }

  // Action methods
  async goto(): Promise<void> {
    const loginUrl = process.env.LOGIN_URL;
    if (loginUrl && loginUrl.startsWith('http')) {
      await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    } else {
      await this.navigateTo('/login');
    }
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLogin(): Promise<void> {
    await this.continueButton.click();
  }

  async fillEmail(email: string): Promise<void> {
    await this.enterEmail(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.enterPassword(password);
  }

  async submitLogin(): Promise<void> {
    await this.clickLogin();
  }

  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async clickSignup(): Promise<void> {
    await this.signupLink.click();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible({ timeout: 10000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 10000 });
    await expect(this.continueButton).toBeVisible({ timeout: 10000 });
  }
}
