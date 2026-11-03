import * as fs from 'fs';
import * as path from 'path';
import { analyzeDiff } from './analyze-diff';
import { getAIProvider, TestCaseCollection, RawTestCase } from './ai-provider';

/**
 * Validates a test case against the required schema
 */
export function validateTestCase(tc: RawTestCase, index: number): string[] {
  const errors: string[] = [];

  if (!tc.id || typeof tc.id !== 'string') {
    errors.push(`Case #${index}: missing or invalid 'id'`);
  } else if (!/^TC-[A-Z0-9]+-[0-9]{3,}$/.test(tc.id)) {
    errors.push(`Case #${index}: 'id' format invalid ("${tc.id}"), expected TC-<MODULE>-XXX`);
  }

  if (!tc.module || typeof tc.module !== 'string') {
    errors.push(`Case #${index}: missing or invalid 'module'`);
  }

  if (!tc.feature || typeof tc.feature !== 'string') {
    errors.push(`Case #${index}: missing or invalid 'feature'`);
  }

  if (!tc.scenario || typeof tc.scenario !== 'string') {
    errors.push(`Case #${index}: missing or invalid 'scenario'`);
  }

  if (!Array.isArray(tc.steps) || tc.steps.length === 0) {
    errors.push(`Case #${index}: 'steps' must be a non-empty array of strings`);
  }

  if (!tc.expectedResult || typeof tc.expectedResult !== 'string') {
    errors.push(`Case #${index}: missing or invalid 'expectedResult'`);
  }

  const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
  if (!validPriorities.includes(tc.priority)) {
    errors.push(`Case #${index}: invalid 'priority' "${tc.priority}". Allowed: ${validPriorities.join(', ')}`);
  }

  const validTypes = ['Positive', 'Negative', 'Boundary', 'Regression'];
  if (!validTypes.includes(tc.testType)) {
    errors.push(`Case #${index}: invalid 'testType' "${tc.testType}". Allowed: ${validTypes.join(', ')}`);
  }

  if (!tc.sourceFile || typeof tc.sourceFile !== 'string') {
    errors.push(`Case #${index}: missing or invalid 'sourceFile'`);
  }

  return errors;
}

export async function generateTestCases(): Promise<TestCaseCollection> {
  console.log('[generate-test-cases] Step 1: Analyzing diff and mapping modules...');
  const targetBranch = process.env.TARGET_BRANCH || 'origin/dev';
  const diffAnalysis = analyzeDiff(targetBranch);

  console.log(`[generate-test-cases] Step 2: Requesting test cases from AI Provider: ${process.env.AI_PROVIDER || 'offline'}...`);
  const provider = getAIProvider();
  const collection = await provider.generateTestCases(diffAnalysis);

  console.log(`[generate-test-cases] Step 3: Validating schema for ${collection.testCases.length} generated test cases...`);
  const allErrors: string[] = [];
  const validCases: RawTestCase[] = [];

  collection.testCases.forEach((tc, idx) => {
    const errs = validateTestCase(tc, idx + 1);
    if (errs.length > 0) {
      allErrors.push(...errs);
      console.warn(`[generate-test-cases] Rejected invalid test case: ${errs.join('; ')}`);
    } else {
      validCases.push(tc);
    }
  });

  if (validCases.length === 0) {
    throw new Error(`Test case validation failed: All generated test cases were malformed. Errors: ${allErrors.join('\n')}`);
  }

  collection.testCases = validCases;
  collection.metadata.totalCases = validCases.length;

  // Persist generated test cases
  const generatedDir = path.resolve(process.cwd(), 'automation/test-cases/generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampFile = path.join(generatedDir, `test-cases-${timestamp}.json`);
  const latestFile = path.join(generatedDir, 'latest-test-cases.json');

  const serialized = JSON.stringify(collection, null, 2);
  fs.writeFileSync(timestampFile, serialized, 'utf-8');
  fs.writeFileSync(latestFile, serialized, 'utf-8');

  console.log(`[generate-test-cases] Successfully generated and stored ${validCases.length} test cases in ${latestFile}`);
  return collection;
}

if (require.main === module) {
  generateTestCases().catch((err) => {
    console.error('[generate-test-cases] Error:', err);
    process.exit(1);
  });
}
