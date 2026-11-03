import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model for Happy Prancer automation
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForUrl(urlOrPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlOrPattern, { timeout: 15000 });
  }

  async getToastMessage(): Promise<string | null> {
    const toast = this.page.locator('.Toastify__toast-body, [role="alert"]');
    try {
      await toast.first().waitFor({ state: 'visible', timeout: 5000 });
      return await toast.first().innerText();
    } catch {
      return null;
    }
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }
}
