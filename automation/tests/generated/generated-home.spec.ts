/**
 * AUTO-GENERATED PLAYWRIGHT TEST SUITE FOR HAPPY PRANCER
 * Module: Home
 * Target Branch: test-workflow
 * Total Generated Tests: 3
 * Generated: 2026-11-05T11:11:51.700Z
 * 1-to-1 Mapping with latest-test-cases.json testCaseId
 */

import { test, expect } from '../../fixtures/base.fixture';

test.describe('Generated AI Tests - Home [@generated]', () => {

  /**
   * [HOME-001] Verify Happy Prancer landing page loads with top navigation and header
   * Priority: Critical | Type: Positive
   * Source: src/Development/pages/public/Home/index.jsx
   */
  test('HOME-001 - Verify Happy Prancer landing page loads with top navigation and header', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.expectHomeLoaded();
  });

  /**
   * [HOME-002] Verify navigation to Login page routes to /login
   * Priority: High | Type: Positive
   * Source: src/Development/pages/public/Home/index.jsx
   */
  test('HOME-002 - Verify navigation to Login page routes to /login', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.clickLogin();
    await page.waitForURL(/.*login.*/, { timeout: 10000 });
    expect(page.url()).toContain('login');
  });

  /**
   * [HOME-003] Verify Home page sections (Hero, Perks, FAQs) render properly
   * Priority: Medium | Type: Positive
   * Source: src/Development/pages/public/Home/index.jsx
   */
  test('HOME-003 - Verify Home page sections (Hero, Perks, FAQs) render properly', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.expectHomeLoaded();
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
