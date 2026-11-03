import { test as baseTest, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { SignupPage } from '../page-objects/SignupPage';
import { HomePage } from '../page-objects/HomePage';
import { InstructorsPage } from '../page-objects/InstructorsPage';
import { GalleryPage } from '../page-objects/GalleryPage';
import { DashboardPage } from '../page-objects/DashboardPage';

/**
 * Custom Playwright test fixture with pre-initialized Page Objects
 * and environment diagnostic assertions.
 */
type AutomationFixtures = {
  loginPage: LoginPage;
  signupPage: SignupPage;
  homePage: HomePage;
  instructorsPage: InstructorsPage;
  galleryPage: GalleryPage;
  dashboardPage: DashboardPage;
};

export const test = baseTest.extend<AutomationFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  instructorsPage: async ({ page }, use) => {
    await use(new InstructorsPage(page));
  },
  galleryPage: async ({ page }, use) => {
    await use(new GalleryPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect };
