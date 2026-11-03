import * as fs from 'fs';
import * as path from 'path';
import { TestCaseCollection, RawTestCase } from './ai-provider';

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
}

/**
 * Generates Playwright test method code for a single structured test case
 */
function buildTestMethod(tc: RawTestCase): string {
  const modKey = tc.module.toLowerCase();
  let pageObjectUsage = 'page';
  let testStepsCode = '';

  if (modKey.includes('login') || modKey.includes('auth')) {
    pageObjectUsage = 'loginPage, page';
    if (tc.testType === 'Negative') {
      testStepsCode = `
    await loginPage.goto();
    await loginPage.submitLogin();
    const isEmailValid = await loginPage.emailInput.evaluate((el) => (el as HTMLInputElement).checkValidity());
    expect(isEmailValid).toBe(false);`;
    } else if (tc.scenario.toLowerCase().includes('forgot password')) {
      testStepsCode = `
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await page.waitForURL(/.*forgot-password.*/, { timeout: 10000 });
    expect(page.url()).toContain('forgot-password');`;
    } else {
      testStepsCode = `
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
    await expect(loginPage.emailInput).toBeEnabled();
    await expect(loginPage.passwordInput).toBeEnabled();`;
    }
  } else if (modKey.includes('signup')) {
    pageObjectUsage = 'signupPage, page';
    if (tc.scenario.toLowerCase().includes('referral')) {
      testStepsCode = `
    await page.goto('/signup?referral=AUTOMATION_AI', { waitUntil: 'domcontentloaded' });
    const referralValue = await signupPage.referralInput.inputValue();
    expect(referralValue).toBe('AUTOMATION_AI');`;
    } else if (tc.testType === 'Negative') {
      testStepsCode = `
    await signupPage.goto();
    await signupPage.submitSignup();
    const isNameValid = await signupPage.nameInput.evaluate((el) => (el as HTMLInputElement).checkValidity());
    expect(isNameValid).toBe(false);`;
    } else {
      testStepsCode = `
    await signupPage.goto();
    await signupPage.expectSignupFormVisible();
    await expect(signupPage.createAccountButton).toBeVisible();`;
    }
  } else if (modKey.includes('home')) {
    pageObjectUsage = 'homePage, page';
    testStepsCode = `
    await homePage.goto();
    await homePage.expectHomeLoaded();`;
  } else if (modKey.includes('instructor')) {
    pageObjectUsage = 'instructorsPage, page';
    testStepsCode = `
    await instructorsPage.goto();
    await instructorsPage.expectPageLoaded();`;
  } else if (modKey.includes('gallery')) {
    pageObjectUsage = 'galleryPage, page';
    testStepsCode = `
    await galleryPage.goto();
    await galleryPage.expectGalleryLoaded();`;
  } else {
    pageObjectUsage = 'page';
    const rawRoute = typeof tc.testData === 'object' && tc.testData !== null && 'route' in tc.testData ? (tc.testData as any).route : '/';
    const route = String(rawRoute || '/');
    testStepsCode = `
    const route = '${route}';
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(route.replace('/', '\\\\/')));`;
  }

  return `
  /**
   * [${tc.id}] ${tc.scenario}
   * Priority: ${tc.priority} | Type: ${tc.testType}
   * Source: ${tc.sourceFile}
   */
  test('${tc.id}: ${tc.scenario.replace(/'/g, "\\'")}', async ({ ${pageObjectUsage} }) => {${testStepsCode}
  });`;
}

/**
 * Generate Playwright TypeScript spec files from structured test cases
 */
export async function generatePlaywrightScripts(): Promise<string[]> {
  const jsonPath = path.resolve(process.cwd(), 'automation/test-cases/generated/latest-test-cases.json');

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Cannot generate Playwright scripts: ${jsonPath} not found. Run generate-test-cases first.`);
  }

  const content = fs.readFileSync(jsonPath, 'utf-8');
  const collection: TestCaseCollection = JSON.parse(content);

  const testsGeneratedDir = path.resolve(process.cwd(), 'automation/tests/generated');
  if (!fs.existsSync(testsGeneratedDir)) {
    fs.mkdirSync(testsGeneratedDir, { recursive: true });
  }

  // Group test cases by module
  const groupedByModule: { [moduleName: string]: RawTestCase[] } = {};
  for (const tc of collection.testCases) {
    const key = tc.module || 'General';
    if (!groupedByModule[key]) {
      groupedByModule[key] = [];
    }
    groupedByModule[key].push(tc);
  }

  const generatedFiles: string[] = [];

  for (const [moduleName, cases] of Object.entries(groupedByModule)) {
    const safeModuleName = sanitizeFilename(moduleName);
    const fileName = `generated-${safeModuleName}.spec.ts`;
    const filePath = path.join(testsGeneratedDir, fileName);

    const testMethods = cases.map((tc) => buildTestMethod(tc)).join('\n');

    const fileContent = `/**
 * AUTO-GENERATED PLAYWRIGHT TEST SUITE FOR HAPPY PRANCER
 * Module: ${moduleName}
 * Target Branch: ${collection.metadata.targetBranch}
 * Generated: ${collection.metadata.generatedAt}
 * Do not edit manually - generated by Happy Prancer AI Automation Pipeline
 */

import { test, expect } from '../../fixtures/base.fixture';

test.describe('Generated AI Tests - ${moduleName} [@generated]', () => {
${testMethods}
});
`;

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    generatedFiles.push(filePath);
    console.log(`[generate-playwright] Created Playwright spec: ${filePath} (${cases.length} tests)`);
  }

  return generatedFiles;
}

if (require.main === module) {
  generatePlaywrightScripts().catch((err) => {
    console.error('[generate-playwright] Error:', err);
    process.exit(1);
  });
}
