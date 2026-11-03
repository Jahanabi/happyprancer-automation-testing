import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Gallery Page Object Model
 */
export class GalleryPage extends BasePage {
  readonly galleryImages: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.galleryImages = page.locator('img');
    this.heading = page.locator('h1, h2, text=Gallery').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo('/gallery');
  }

  async expectGalleryLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async getImagesCount(): Promise<number> {
    return await this.galleryImages.count();
  }
}
