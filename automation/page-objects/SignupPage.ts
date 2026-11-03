import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Signup Page Object Model
 */
export class SignupPage extends BasePage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly countrySelect: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly referralInput: Locator;
  readonly createAccountButton: Locator;
  readonly googleSignupButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('#signup-name');
    this.emailInput = page.locator('#signup-email');
    this.countrySelect = page.locator('#signup-country');
    this.phoneInput = page.locator('#signup-phone');
    this.passwordInput = page.locator('#signup-password');
    this.referralInput = page.locator('#signup-referral');
    this.createAccountButton = page.locator('button:has-text("Create Account")');
    this.googleSignupButton = page.locator('button:has-text("Sign up with Google")');
    this.heading = page.locator('text=Create Your Account').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo('/signup');
  }

  async fillSignupForm(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    referral?: string;
  }): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    if (data.country) {
      await this.countrySelect.selectOption(data.country);
    }
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
    await this.passwordInput.fill(data.password);
    if (data.referral) {
      await this.referralInput.fill(data.referral);
    }
  }

  async submitSignup(): Promise<void> {
    await this.createAccountButton.click();
  }

  async expectSignupFormVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.createAccountButton).toBeVisible();
  }
}
