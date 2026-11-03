import { DiffAnalysisResult } from './analyze-diff';
import { HAPPY_PRANCER_MODULES } from '../config/automation.config';

export interface RawTestCase {
  id: string;
  module: string;
  feature: string;
  scenario: string;
  preconditions: string[] | string;
  steps: string[];
  testData?: Record<string, any> | string | null;
  expectedResult: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  testType: 'Positive' | 'Negative' | 'Boundary' | 'Regression';
  sourceFile: string;
}

export interface TestCaseCollection {
  metadata: {
    generatedAt: string;
    prNumber?: number | string | null;
    commitSha?: string | null;
    targetBranch: string;
    totalCases: number;
    affectedModules: string[];
    aiProvider: string;
  };
  testCases: RawTestCase[];
}

export interface IAIProvider {
  name: string;
  generateTestCases(analysis: DiffAnalysisResult): Promise<TestCaseCollection>;
}

/**
 * Heuristic/Offline AI Provider:
 * Generates deterministic, high-quality test cases based on AST/diff mapping of Happy Prancer modules
 * without requiring external network connectivity or exposed API keys.
 */
export class HeuristicAIProvider implements IAIProvider {
  name = 'heuristic-engine';

  async generateTestCases(analysis: DiffAnalysisResult): Promise<TestCaseCollection> {
    const testCases: RawTestCase[] = [];
    let counter = 1;

    for (const modKey of analysis.affectedModules) {
      const mod = HAPPY_PRANCER_MODULES[modKey];
      if (!mod) continue;

      const primaryFile = analysis.moduleDetails[modKey]?.files[0] || `src/${mod.name}`;

      if (modKey === 'login') {
        testCases.push({
          id: `TC-AUTH-${String(counter++).padStart(3, '0')}`,
          module: 'Login',
          feature: 'Email & Password Authentication',
          scenario: 'Verify successful login form rendering with email and password fields',
          preconditions: ['User navigates to login page /login', 'Application is rendered'],
          steps: [
            'Navigate to /login',
            'Verify email input with locator #login-email is visible',
            'Verify password input with locator #login-password is visible',
            'Verify continue button is visible and enabled',
          ],
          testData: { route: '/login' },
          expectedResult: 'Login form is fully rendered and ready for user credential entry',
          priority: 'Critical',
          testType: 'Positive',
          sourceFile: primaryFile,
        });

        testCases.push({
          id: `TC-AUTH-${String(counter++).padStart(3, '0')}`,
          module: 'Login',
          feature: 'Form Validation',
          scenario: 'Verify native form validation prevents submission when email is missing or empty',
          preconditions: ['User is on /login'],
          steps: [
            'Leave email field blank',
            'Click Continue button',
            'Assert native HTML5 validation rejects empty input',
          ],
          testData: { email: '', password: 'Password123!' },
          expectedResult: 'Form submission is halted and email field shows validation error',
          priority: 'High',
          testType: 'Negative',
          sourceFile: primaryFile,
        });

        testCases.push({
          id: `TC-AUTH-${String(counter++).padStart(3, '0')}`,
          module: 'Login',
          feature: 'Password Recovery Link',
          scenario: 'Verify Forgot Password link routes user to /forgot-password',
          preconditions: ['User is on /login'],
          steps: [
            'Locate "Forgot password?" link',
            'Click "Forgot password?" link',
            'Verify URL changes to /forgot-password',
          ],
          testData: null,
          expectedResult: 'Navigation to password reset workflow succeeds',
          priority: 'Medium',
          testType: 'Positive',
          sourceFile: primaryFile,
        });
      } else if (modKey === 'signup') {
        testCases.push({
          id: `TC-SIGNUP-${String(counter++).padStart(3, '0')}`,
          module: 'Signup',
          feature: 'Account Registration Form',
          scenario: 'Verify all registration inputs (name, email, country, phone, password) render properly',
          preconditions: ['User navigates to /signup'],
          steps: [
            'Navigate to /signup',
            'Verify name, email, country select, phone, and password inputs are present',
            'Verify Create Account button is visible',
          ],
          testData: { route: '/signup' },
          expectedResult: 'Signup form is rendered with all required fields',
          priority: 'Critical',
          testType: 'Positive',
          sourceFile: primaryFile,
        });

        testCases.push({
          id: `TC-SIGNUP-${String(counter++).padStart(3, '0')}`,
          module: 'Signup',
          feature: 'Referral Query Parameter',
          scenario: 'Verify referral code passed via URL query parameter automatically populates referral field',
          preconditions: ['User opens /signup with ?referral=HPWELCOME'],
          steps: [
            'Navigate to /signup?referral=HPWELCOME',
            'Locate referral input #signup-referral',
            'Verify value matches HPWELCOME',
          ],
          testData: { referral: 'HPWELCOME' },
          expectedResult: 'Referral input has "HPWELCOME" populated automatically',
          priority: 'High',
          testType: 'Boundary',
          sourceFile: primaryFile,
        });
      } else if (modKey === 'home') {
        testCases.push({
          id: `TC-HOME-${String(counter++).padStart(3, '0')}`,
          module: 'Home',
          feature: 'Landing Page & Branding',
          scenario: 'Verify Happy Prancer landing page loads with top navigation and header',
          preconditions: ['Application is accessible at baseURL'],
          steps: [
            'Navigate to /',
            'Verify navigation bar exists',
            'Verify hero header or promotional section is displayed',
          ],
          testData: null,
          expectedResult: 'Landing page loads without error and displays navigation bar',
          priority: 'High',
          testType: 'Positive',
          sourceFile: primaryFile,
        });
      } else if (modKey === 'instructors') {
        testCases.push({
          id: `TC-INST-${String(counter++).padStart(3, '0')}`,
          module: 'Instructors',
          feature: 'Instructor Directory',
          scenario: 'Verify instructors page displays list of dance instructors with details',
          preconditions: ['User navigates to /instructor'],
          steps: [
            'Navigate to /instructor',
            'Verify instructor heading is visible',
            'Verify instructor cards are rendered',
          ],
          testData: null,
          expectedResult: 'Instructor profiles and cards are visible on the page',
          priority: 'High',
          testType: 'Positive',
          sourceFile: primaryFile,
        });
      } else if (modKey === 'gallery') {
        testCases.push({
          id: `TC-GAL-${String(counter++).padStart(3, '0')}`,
          module: 'Gallery',
          feature: 'Image Alt Text & Visual Accessibility',
          scenario: 'Verify gallery photos have descriptive alt attributes and render in grid',
          preconditions: ['User navigates to /gallery'],
          steps: [
            'Navigate to /gallery',
            'Verify gallery heading is visible',
            'Verify gallery images are present in DOM with non-empty alt text',
          ],
          testData: null,
          expectedResult: 'Gallery displays images with accessible descriptive alt text',
          priority: 'Medium',
          testType: 'Positive',
          sourceFile: primaryFile,
        });
      } else {
        // Generic module test case generator
        testCases.push({
          id: `TC-${modKey.toUpperCase().slice(0, 4)}-${String(counter++).padStart(3, '0')}`,
          module: mod.name,
          feature: `${mod.name} Module Navigation & State`,
          scenario: `Verify ${mod.name} route (${mod.route}) loads expected UI components`,
          preconditions: [`User navigates to ${mod.route}`],
          steps: [
            `Navigate to ${mod.route}`,
            `Verify primary container is displayed`,
          ],
          testData: { route: mod.route },
          expectedResult: `${mod.name} page loads properly without uncaught exceptions`,
          priority: 'Medium',
          testType: 'Regression',
          sourceFile: primaryFile,
        });
      }
    }

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        prNumber: process.env.PR_NUMBER || null,
        commitSha: process.env.GITHUB_SHA || null,
        targetBranch: analysis.targetBranch,
        totalCases: testCases.length,
        affectedModules: analysis.affectedModules,
        aiProvider: this.name,
      },
      testCases,
    };
  }
}

/**
 * Cloud LLM AI Provider (OpenAI, Anthropic, or Gemini)
 */
export class CloudLLMAIProvider implements IAIProvider {
  name: string;
  apiKey: string;
  model: string;
  endpoint: string;

  constructor(providerName: string, apiKey: string, model?: string) {
    this.name = providerName;
    this.apiKey = apiKey;
    this.model = model || (providerName === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');
    this.endpoint =
      providerName === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async generateTestCases(analysis: DiffAnalysisResult): Promise<TestCaseCollection> {
    if (!this.apiKey) {
      console.log(`[ai-provider] No API key configured for ${this.name}, using Heuristic engine fallback.`);
      return new HeuristicAIProvider().generateTestCases(analysis);
    }

    try {
      const prompt = `You are a Senior QA Automation Engineer for Happy Prancer.
Analyze the following Git diff and changed modules to generate structured Playwright test cases.
Affected modules: ${analysis.affectedModules.join(', ')}
Diff snippet:
${analysis.diffSnippet}

Return ONLY valid JSON with this exact schema:
{
  "testCases": [
    {
      "id": "TC-<MODULE>-001",
      "module": "<ModuleName>",
      "feature": "<FeatureName>",
      "scenario": "<ScenarioDescription>",
      "preconditions": ["<Precondition1>"],
      "steps": ["Step 1", "Step 2"],
      "testData": null,
      "expectedResult": "<ExpectedOutcome>",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "testType": "Positive" | "Negative" | "Boundary" | "Regression",
      "sourceFile": "<FileThatMotivatedTheTest>"
    }
  ]
}`;

      // Call OpenAI-compatible endpoint
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      return {
        metadata: {
          generatedAt: new Date().toISOString(),
          prNumber: process.env.PR_NUMBER || null,
          commitSha: process.env.GITHUB_SHA || null,
          targetBranch: analysis.targetBranch,
          totalCases: parsed.testCases?.length || 0,
          affectedModules: analysis.affectedModules,
          aiProvider: this.name,
        },
        testCases: parsed.testCases || [],
      };
    } catch (err) {
      console.warn(`[ai-provider] Cloud LLM invocation failed, falling back to heuristic engine:`, (err as Error).message);
      return new HeuristicAIProvider().generateTestCases(analysis);
    }
  }
}

/**
 * Factory to instantiate configured AI provider
 */
export function getAIProvider(): IAIProvider {
  const provider = (process.env.AI_PROVIDER || 'offline').toLowerCase();
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL;

  if (provider === 'openai' || provider === 'gemini' || (apiKey && provider !== 'offline')) {
    return new CloudLLMAIProvider(provider, apiKey, model);
  }

  return new HeuristicAIProvider();
}
