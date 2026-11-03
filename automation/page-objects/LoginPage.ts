import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Login Page Object Model
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;
  readonly googleSignInButton: Locator;
  readonly loginHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    this.signupLink = page.locator('a[href="/signup"]');
    this.googleSignInButton = page.locator('button:has-text("Sign in with Google")');
    this.loginHeading = page.locator('text=Login').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submitLogin(): Promise<void> {
    await this.continueButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitLogin();
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async clickSignup(): Promise<void> {
    await this.signupLink.click();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }
}
