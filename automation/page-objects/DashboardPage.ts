import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Happy Prancer Dashboard Page Object Model
 */
export class DashboardPage extends BasePage {
  readonly dashboardContent: Locator;
  readonly upcomingSessionsLink: Locator;
  readonly previousSessionsLink: Locator;
  readonly rewardsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardContent = page.locator('main, [data-testid="dashboard"], div.dashboard').first();
    this.upcomingSessionsLink = page.locator('a[href*="upcoming-sessions"], text=Upcoming');
    this.previousSessionsLink = page.locator('a[href*="previous-sessions"], text=Previous');
    this.rewardsLink = page.locator('a[href*="rewards"], text=Rewards');
  }

  async goto(): Promise<void> {
    await this.navigateTo('/dashboard');
  }

  async gotoUpcomingSessions(): Promise<void> {
    await this.navigateTo('/dashboard/upcoming-sessions');
  }

  async gotoPreviousSessions(): Promise<void> {
    await this.navigateTo('/dashboard/previous-sessions');
  }

  async gotoRewards(): Promise<void> {
    await this.navigateTo('/dashboard/rewards');
  }
}
