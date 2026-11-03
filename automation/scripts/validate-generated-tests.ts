import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { TestCaseCollection } from './ai-provider';
import { validateTestCase } from './generate-test-cases';

export interface ValidationSummary {
  jsonValidation: { passed: boolean; count: number; errors: string[] };
  syntaxValidation: { passed: boolean; message: string };
  discoveryValidation: { passed: boolean; discoveredCount: number; message: string };
  environmentCheck: { available: boolean; baseUrl: string; message: string };
  executionStatus: 'VALIDATED_AND_DISCOVERED' | 'ENVIRONMENT_NOT_READY' | 'VALIDATION_FAILED';
}

/**
 * Validate generated test cases and generated Playwright scripts
 */
export async function validateGeneratedTests(): Promise<ValidationSummary> {
  console.log('[validate-generated-tests] Starting validation pipeline...');
  const jsonPath = path.resolve(process.cwd(), 'automation/test-cases/generated/latest-test-cases.json');

  const summary: ValidationSummary = {
    jsonValidation: { passed: false, count: 0, errors: [] },
    syntaxValidation: { passed: false, message: '' },
    discoveryValidation: { passed: false, discoveredCount: 0, message: '' },
    environmentCheck: {
      available: false,
      baseUrl: process.env.BASE_URL || 'https://beta.happyprancer.com/',
      message: '',
    },
    executionStatus: 'VALIDATION_FAILED',
  };

  // 1. Validate JSON schema and test case structure
  if (!fs.existsSync(jsonPath)) {
    summary.jsonValidation.errors.push(`Missing latest test cases file: ${jsonPath}`);
    console.error(summary.jsonValidation.errors[0]);
    return summary;
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf-8');
  let collection: TestCaseCollection;
  try {
    collection = JSON.parse(rawJson);
  } catch (err) {
    summary.jsonValidation.errors.push(`Invalid JSON syntax: ${(err as Error).message}`);
    return summary;
  }

  const jsonErrors: string[] = [];
  (collection.testCases || []).forEach((tc, idx) => {
    const errs = validateTestCase(tc, idx + 1);
    if (errs.length > 0) jsonErrors.push(...errs);
  });

  if (jsonErrors.length === 0 && collection.testCases.length > 0) {
    summary.jsonValidation.passed = true;
    summary.jsonValidation.count = collection.testCases.length;
    console.log(`[validate-generated-tests] JSON schema validation passed for ${collection.testCases.length} cases.`);
  } else {
    summary.jsonValidation.errors = jsonErrors;
    console.warn(`[validate-generated-tests] JSON schema validation failed:`, jsonErrors);
  }

  // 2. Validate TypeScript syntax on generated spec files
  try {
    console.log('[validate-generated-tests] Validating TypeScript syntax on generated specs...');
    execSync('npx tsc --noEmit --project tsconfig.automation.json', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    summary.syntaxValidation.passed = true;
    summary.syntaxValidation.message = 'TypeScript syntax and type checks passed cleanly.';
    console.log(`[validate-generated-tests] ${summary.syntaxValidation.message}`);
  } catch (err: any) {
    summary.syntaxValidation.passed = false;
    summary.syntaxValidation.message = err.stdout || err.stderr || err.message;
    console.error('[validate-generated-tests] TypeScript syntax validation error:', summary.syntaxValidation.message);
  }

  // 3. Validate Playwright Test Discovery
  try {
    console.log('[validate-generated-tests] Running Playwright test discovery (npx playwright test --list)...');
    const discoveryOutput = execSync('npx playwright test --list', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const matches = discoveryOutput.match(/Total:\s+(\d+)\s+tests/i);
    const count = matches ? parseInt(matches[1], 10) : 0;
    summary.discoveryValidation.passed = true;
    summary.discoveryValidation.discoveredCount = count;
    summary.discoveryValidation.message = `Discovered ${count} tests successfully across projects.`;
    console.log(`[validate-generated-tests] ${summary.discoveryValidation.message}`);
  } catch (err: any) {
    summary.discoveryValidation.passed = false;
    summary.discoveryValidation.message = err.stdout || err.stderr || err.message;
    console.error('[validate-generated-tests] Playwright test discovery failed:', summary.discoveryValidation.message);
  }

  // 4. Check whether test environment is reachable
  const baseUrl = process.env.BASE_URL || 'https://beta.happyprancer.com/';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(baseUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    summary.environmentCheck.available = resp.status < 500;
    summary.environmentCheck.message = `Test environment responsive at ${baseUrl} (HTTP ${resp.status})`;
  } catch {
    summary.environmentCheck.available = false;
    summary.environmentCheck.message = `No active local server responding at ${baseUrl}. Browser execution safely held pending environment.`;
  }

  if (summary.jsonValidation.passed && summary.syntaxValidation.passed && summary.discoveryValidation.passed) {
    summary.executionStatus = summary.environmentCheck.available
      ? 'VALIDATED_AND_DISCOVERED'
      : 'ENVIRONMENT_NOT_READY';
  } else {
    summary.executionStatus = 'VALIDATION_FAILED';
  }

  // Write summary markdown and JSON report
  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(reportsDir, 'validation-summary.json'), JSON.stringify(summary, null, 2));

  // Generate GitHub Step Summary Markdown
  const markdownReport = `### 🤖 Happy Prancer AI Test Automation Validation Summary

| Check | Status | Details |
| :--- | :--- | :--- |
| **JSON Schema** | ${summary.jsonValidation.passed ? '✅ PASSED' : '❌ FAILED'} | ${summary.jsonValidation.count} structured test cases validated |
| **TypeScript Syntax** | ${summary.syntaxValidation.passed ? '✅ PASSED' : '❌ FAILED'} | Verified with \`tsc --noEmit\` |
| **Playwright Discovery** | ${summary.discoveryValidation.passed ? '✅ PASSED' : '❌ FAILED'} | ${summary.discoveryValidation.discoveredCount} tests discovered by Playwright |
| **Test Environment** | ${summary.environmentCheck.available ? '🟢 LIVE' : '⚠️ STANDBY'} | ${summary.environmentCheck.message} |
| **Overall Status** | **${summary.executionStatus}** | ${summary.executionStatus === 'ENVIRONMENT_NOT_READY' ? 'Tests validated without false passes; awaiting dev server.' : 'Ready for test execution.'} |
`;

  fs.writeFileSync(path.join(reportsDir, 'validation-summary.md'), markdownReport);

  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryFile) {
    fs.appendFileSync(stepSummaryFile, `\n${markdownReport}\n`);
  }

  console.log(`[validate-generated-tests] Validation completed with status: ${summary.executionStatus}`);
  return summary;
}

if (require.main === module) {
  validateGeneratedTests().then((summary) => {
    if (summary.executionStatus === 'VALIDATION_FAILED') {
      console.error('[validate-generated-tests] Validation failed: One or more validation checks did not pass.');
      process.exit(1);
    }
  }).catch((err) => {
    console.error('[validate-generated-tests] Execution error:', err);
    process.exit(1);
  });
}
