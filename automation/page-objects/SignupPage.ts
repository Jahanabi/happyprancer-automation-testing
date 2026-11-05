import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Signup Page Object Model
 * Fully supports reference tests SIGNUP-001 through SIGNUP-022
 */
export class SignupPage extends BasePage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly countrySelect: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly referralInput: Locator;
  readonly createAccountButton: Locator;
  readonly googleSignupButton: Locator;
  readonly emailSignupButton: Locator;
  readonly heading: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly otpInput: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('#signup-name');
    this.emailInput = page.locator('#signup-email');
    this.countrySelect = page.locator('#signup-country');
    this.phoneInput = page.locator('#signup-phone');
    this.passwordInput = page.locator('#signup-password');
    this.confirmPasswordInput = page.locator('#signup-confirm-password, input[name="confirmPassword"], input[name="confirm_password"]');
    this.referralInput = page.locator('#signup-referral');
    this.createAccountButton = page.locator('button:has-text("Create Account"), button[type="submit"]');
    this.googleSignupButton = page.locator('button:has-text("Sign up with Google")');
    this.emailSignupButton = page.locator('button:has-text("Create Account"), button:has-text("Sign up with email")');
    this.heading = page.locator('text=Create Your Account').first();
    this.successMessage = page.locator('.Toastify__toast--success, text=/account created|signup successful|success/i');
    this.errorMessage = page.locator('.Toastify__toast--error, [role="alert"]');
    this.otpInput = page.locator('input[name="otp"], #otp, text=/verify.*otp|enter.*otp/i');
  }

  // Getters for SIGNUP-001 to SIGNUP-022
  getFullNameInput(): Locator {
    return this.nameInput;
  }

  getEmailSignupButton(): Locator {
    return this.emailSignupButton;
  }

  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getCreateAccountButton(): Locator {
    return this.createAccountButton;
  }

  getPhoneInput(): Locator {
    return this.phoneInput;
  }

  getConfirmPasswordInput(): Locator {
    return this.confirmPasswordInput;
  }

  getGoogleSignupButton(): Locator {
    return this.googleSignupButton;
  }

  getSuccessMessage(): Locator {
    return this.successMessage;
  }

  getErrorMessage(): Locator {
    return this.errorMessage;
  }

  async hasFullName(): Promise<boolean> {
    return await this.nameInput.isVisible().catch(() => false);
  }

  async enterFullName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async hasEmail(): Promise<boolean> {
    return await this.emailInput.isVisible().catch(() => false);
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async hasPhone(): Promise<boolean> {
    return await this.phoneInput.isVisible().catch(() => false);
  }

  async enterPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async hasConfirmPassword(): Promise<boolean> {
    return await this.confirmPasswordInput.isVisible().catch(() => false);
  }

  async enterConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async clickCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
  }

  async hasReferralCode(): Promise<boolean> {
    return await this.referralInput.isVisible().catch(() => false);
  }

  async enterReferralCode(code: string): Promise<void> {
    await this.referralInput.fill(code);
  }

  async hasOtp(): Promise<boolean> {
    return await this.otpInput.isVisible().catch(() => false);
  }

  async hasGoogleSignup(): Promise<boolean> {
    return await this.googleSignupButton.isVisible().catch(() => false);
  }

  // Existing methods
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
    await this.clickCreateAccount();
  }

  async expectSignupFormVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible({ timeout: 15000 });
    await expect(this.emailInput).toBeVisible({ timeout: 15000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 15000 });
    await expect(this.createAccountButton).toBeVisible({ timeout: 15000 });
  }
}
