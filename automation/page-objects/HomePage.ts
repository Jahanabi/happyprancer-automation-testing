import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Home / Landing Page Object Model
 */
export class HomePage extends BasePage {
  readonly navbar: Locator;
  readonly loginNavButton: Locator;
  readonly heroSection: Locator;
  readonly plansSection: Locator;
  readonly faqsSection: Locator;
  readonly testimonialsSection: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = page.locator('nav').first();
    this.loginNavButton = page.locator('a[href="/login"]').first();
    this.heroSection = page.locator('section, div[class*="Hero"]').first();
    this.plansSection = page.locator('text=Membership Plan, text=Subscription, div[class*="Subscriptions"]').first();
    this.faqsSection = page.locator('text=Frequently Asked Questions, text=FAQ, div[class*="FAQ"]').first();
    this.testimonialsSection = page.locator('text=Testimonials, div[class*="Testimonial"]').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo('/');
  }

  async clickLogin(): Promise<void> {
    await this.loginNavButton.click();
  }

  async expectHomeLoaded(): Promise<void> {
    await expect(this.navbar).toBeVisible({ timeout: 15000 });
  }
}
