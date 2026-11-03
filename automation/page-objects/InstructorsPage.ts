import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Instructors Page Object Model
 */
export class InstructorsPage extends BasePage {
  readonly instructorCards: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.instructorCards = page.locator('div[class*="InstructorCard"], div[class*="cursor-pointer"]');
    this.heading = page.locator('h1, h2').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo('/instructor');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async getInstructorCardCount(): Promise<number> {
    return await this.instructorCards.count();
  }
}
