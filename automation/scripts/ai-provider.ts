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
 * Heuristic AI Provider:
 * Generates deterministic, comprehensive, code-grounded test cases for Happy Prancer
 * directly mirroring the reference LOGIN-001..020 and SIGNUP-001..022 suites,
 * plus Home, Instructors, Gallery, and Schedule modules.
 */
export class HeuristicAIProvider implements IAIProvider {
  name = 'heuristic-engine';

  async generateTestCases(analysis: DiffAnalysisResult): Promise<TestCaseCollection> {
    const testCases: RawTestCase[] = [];

    // Ensure core modules are evaluated
    const modulesToProcess = new Set(analysis.affectedModules);
    if (modulesToProcess.size === 0) {
      modulesToProcess.add('login');
      modulesToProcess.add('signup');
      modulesToProcess.add('home');
    }

    for (const modKey of modulesToProcess) {
      const mod = HAPPY_PRANCER_MODULES[modKey];
      const primaryFile = analysis.moduleDetails[modKey]?.files[0] || (mod ? `src/${mod.name}` : `src/${modKey}`);

      if (modKey === 'login') {
        const loginCases: Omit<RawTestCase, 'sourceFile'>[] = [
          {
            id: 'LOGIN-001',
            module: 'Login',
            feature: 'Login Page Load & Rendering',
            scenario: 'Login page should load successfully',
            preconditions: ['Application baseUrl is accessible', 'Navigate to /login'],
            steps: ['Open login page', 'Verify email input #login-email is visible', 'Verify password input #login-password is visible'],
            expectedResult: 'Login page loaded successfully with visible email and password fields.',
            priority: 'Critical',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-002',
            module: 'Login',
            feature: 'OAuth Integration',
            scenario: 'Google Sign In should be detected if available',
            preconditions: ['User on login page'],
            steps: ['Check for Google Sign In button locator'],
            expectedResult: 'Google Sign In button detected when available in configuration.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-003',
            module: 'Login',
            feature: 'Password Recovery',
            scenario: 'Forgot Password should be detected if available',
            preconditions: ['User on login page'],
            steps: ['Locate Forgot Password link a[href="/forgot-password"]'],
            expectedResult: 'Forgot Password link detected if provided by application.',
            priority: 'High',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-004',
            module: 'Login',
            feature: 'Form Submission Control',
            scenario: 'Login button should be detected',
            preconditions: ['User on login page'],
            steps: ['Locate Continue/Login submission button'],
            expectedResult: 'Login button detected and visible.',
            priority: 'Critical',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-005',
            module: 'Login',
            feature: 'Registration Navigation',
            scenario: 'Sign Up should be detected if available',
            preconditions: ['User on login page'],
            steps: ['Locate Sign Up link a[href="/signup"]'],
            expectedResult: 'Sign Up link detected when enabled.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-006',
            module: 'Login',
            feature: 'Credential Security',
            scenario: 'Password field should be masked',
            preconditions: ['User on login page'],
            steps: ['Inspect password input type attribute'],
            expectedResult: 'Password field has attribute type="password".',
            priority: 'High',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-007',
            module: 'Login',
            feature: 'Role Management',
            scenario: 'Role selector should be detected if available',
            preconditions: ['User on login page'],
            steps: ['Check for role selector element'],
            expectedResult: 'Role selector detected if institution uses multi-role authentication.',
            priority: 'Low',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-008',
            module: 'Login',
            feature: 'Authentication Validation',
            scenario: 'Invalid email and password should show authentication error',
            preconditions: ['User on login page'],
            steps: ['Enter invalid email', 'Enter invalid password', 'Click Login'],
            expectedResult: 'Invalid credentials rejected and authentication error displayed or form remains visible.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-009',
            module: 'Login',
            feature: 'Email Format Validation',
            scenario: 'Invalid email format should be rejected',
            preconditions: ['User on login page'],
            steps: ['Enter malformed email without @ or domain', 'Trigger validation'],
            expectedResult: 'Browser HTML5 validation or page validation rejects malformed email.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-010',
            module: 'Login',
            feature: 'Password Policy - Length',
            scenario: 'Password should require minimum 8 characters if enforced',
            preconditions: ['User on login page'],
            steps: ['Enter short password (under 8 chars)', 'Check minlength or validation error'],
            expectedResult: 'Minimum 8 character requirement enforced if active on page.',
            priority: 'Medium',
            testType: 'Boundary',
          },
          {
            id: 'LOGIN-011',
            module: 'Login',
            feature: 'Password Policy - Numeric',
            scenario: 'Password should require a number if enforced',
            preconditions: ['User on login page'],
            steps: ['Enter password without numbers', 'Check numeric policy validation'],
            expectedResult: 'Numeric requirement enforced if active on page.',
            priority: 'Medium',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-012',
            module: 'Login',
            feature: 'Password Policy - Uppercase',
            scenario: 'Password should require uppercase letter if enforced',
            preconditions: ['User on login page'],
            steps: ['Enter password without uppercase', 'Check uppercase policy validation'],
            expectedResult: 'Uppercase requirement enforced if active on page.',
            priority: 'Medium',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-013',
            module: 'Login',
            feature: 'Password Policy - Lowercase',
            scenario: 'Password should require lowercase letter if enforced',
            preconditions: ['User on login page'],
            steps: ['Enter password without lowercase', 'Check lowercase policy validation'],
            expectedResult: 'Lowercase requirement enforced if active on page.',
            priority: 'Medium',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-014',
            module: 'Login',
            feature: 'Password Policy - Special Characters',
            scenario: 'Password should require special character if enforced',
            preconditions: ['User on login page'],
            steps: ['Enter password without special characters', 'Check symbol policy validation'],
            expectedResult: 'Special character requirement enforced if active on page.',
            priority: 'Medium',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-015',
            module: 'Login',
            feature: 'End-to-End Authentication',
            scenario: 'Valid email and password should login successfully and redirect to dashboard',
            preconditions: ['LOGIN_EMAIL and LOGIN_PASSWORD configured in environment', 'User on login page'],
            steps: ['Enter valid credentials', 'Click Login', 'Wait for dashboard navigation'],
            expectedResult: 'User logged in successfully and redirected to dashboard.',
            priority: 'Critical',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-016',
            module: 'Login',
            feature: 'Security - SQL Injection',
            scenario: 'Reject SQL injection-like login input',
            preconditions: ['User on login page'],
            steps: ['Enter SQL injection payload in email and password', 'Click Login'],
            expectedResult: 'SQL injection-like login input did not authenticate the user.',
            priority: 'Critical',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-017',
            module: 'Login',
            feature: 'Security - Cross-Site Scripting (XSS)',
            scenario: 'Reject XSS payload in login fields',
            preconditions: ['User on login page'],
            steps: ['Enter script tags in fields', 'Click Login', 'Verify no dialog alert executed'],
            expectedResult: 'XSS payload was not executed.',
            priority: 'Critical',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-018',
            module: 'Login',
            feature: 'Security - Information Disclosure',
            scenario: 'Login error should not expose sensitive information',
            preconditions: ['User on login page'],
            steps: ['Submit invalid login', 'Inspect rendered page text for stack traces or secrets'],
            expectedResult: 'Login error did not expose known sensitive implementation details.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'LOGIN-019',
            module: 'Login',
            feature: 'Credential Security',
            scenario: 'Password field should be masked',
            preconditions: ['User on login page'],
            steps: ['Inspect password input attribute'],
            expectedResult: 'Password field uses password masking.',
            priority: 'High',
            testType: 'Positive',
          },
          {
            id: 'LOGIN-020',
            module: 'Login',
            feature: 'Access Control & Session Protection',
            scenario: 'Protected page should not be accessible without authentication',
            preconditions: ['AUTH_TEST_DASHBOARD_URL configured'],
            steps: ['Navigate to protected dashboard directly', 'Verify user cannot access dashboard'],
            expectedResult: 'Protected page was not accessible without authentication.',
            priority: 'Critical',
            testType: 'Negative',
          },
        ];

        for (const tc of loginCases) {
          testCases.push({
            ...tc,
            sourceFile: 'src/Development/pages/Auth/Login/index.jsx',
          });
        }
      } else if (modKey === 'signup') {
        const signupCases: Omit<RawTestCase, 'sourceFile'>[] = [
          {
            id: 'SIGNUP-001',
            module: 'Signup',
            feature: 'Signup Page Load & Rendering',
            scenario: 'Signup page loads successfully',
            preconditions: ['Navigate to signupUrl'],
            steps: ['Verify full name input visible', 'Verify email input visible', 'Verify password input visible', 'Verify Create Account button visible'],
            expectedResult: 'Signup page loaded successfully.',
            priority: 'Critical',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-002',
            module: 'Signup',
            feature: 'Field Validation - Full Name',
            scenario: 'Full Name is mandatory',
            preconditions: ['User on signup page'],
            steps: ['Verify Full Name input exists', 'Enter test name', 'Assert input value matches'],
            expectedResult: 'Full Name field is available and accepts input.',
            priority: 'High',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-003',
            module: 'Signup',
            feature: 'Field Validation - Email',
            scenario: 'Email field is mandatory',
            preconditions: ['User on signup page'],
            steps: ['Verify Email input exists', 'Enter test email', 'Assert input value matches'],
            expectedResult: 'Email field is available and accepts input.',
            priority: 'Critical',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-004',
            module: 'Signup',
            feature: 'Field Validation - Email Format',
            scenario: 'Invalid email format should be rejected',
            preconditions: ['User on signup page'],
            steps: ['Enter malformed email invalidemail.com', 'Fill remaining fields', 'Assert browser validation flags typeMismatch'],
            expectedResult: 'System rejected the invalid email format.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-005',
            module: 'Signup',
            feature: 'Email Validation - Valid Domain',
            scenario: 'Email should contain valid domain',
            preconditions: ['User on signup page'],
            steps: ['Enter email with valid domain regex', 'Assert pattern match'],
            expectedResult: 'Email with valid domain is accepted.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-006',
            module: 'Signup',
            feature: 'Field Validation - Phone Number',
            scenario: 'Phone number is handled correctly',
            preconditions: ['User on signup page'],
            steps: ['Verify phone input presence', 'Enter phone number', 'Verify value'],
            expectedResult: 'Phone field is available and accepts input.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-007',
            module: 'Signup',
            feature: 'Password Policy - Minimum Length',
            scenario: 'Password must contain at least 8 characters',
            preconditions: ['User on signup page'],
            steps: ['Enter 6-character password', 'Submit form', 'Assert password length policy rejection'],
            expectedResult: 'System rejected password because it contains fewer than 8 characters.',
            priority: 'High',
            testType: 'Boundary',
          },
          {
            id: 'SIGNUP-008',
            module: 'Signup',
            feature: 'Password Policy - Uppercase Required',
            scenario: 'Password must contain uppercase character',
            preconditions: ['User on signup page'],
            steps: ['Enter password lacking uppercase', 'Submit form', 'Assert uppercase policy rejection'],
            expectedResult: 'System rejected password because it does not contain an uppercase letter.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-009',
            module: 'Signup',
            feature: 'Password Policy - Lowercase Required',
            scenario: 'Password must contain lowercase character',
            preconditions: ['User on signup page'],
            steps: ['Enter password lacking lowercase', 'Submit form', 'Assert lowercase policy rejection'],
            expectedResult: 'System rejected password because it does not contain a lowercase character.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-010',
            module: 'Signup',
            feature: 'Password Policy - Number Required',
            scenario: 'Password must contain number',
            preconditions: ['User on signup page'],
            steps: ['Enter password lacking digits', 'Submit form', 'Assert numeric policy rejection'],
            expectedResult: 'System rejected password because it does not contain a number.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-011',
            module: 'Signup',
            feature: 'Password Policy - Special Character Required',
            scenario: 'Password must contain special character',
            preconditions: ['User on signup page'],
            steps: ['Enter password lacking symbols', 'Submit form', 'Assert symbol policy rejection'],
            expectedResult: 'System rejected password because it does not contain a special character.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-012',
            module: 'Signup',
            feature: 'Field Validation - Confirm Password',
            scenario: 'Confirm Password is optional',
            preconditions: ['User on signup page'],
            steps: ['Check confirm password field', 'Verify optional handling if not exposed'],
            expectedResult: 'Confirm Password field is present or safely handled.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-013',
            module: 'Signup',
            feature: 'Password Confirmation Mismatch',
            scenario: 'Confirm Password must match Password when present',
            preconditions: ['User on signup page'],
            steps: ['Enter different passwords in password and confirm fields', 'Submit', 'Verify mismatch rejection'],
            expectedResult: 'System rejected the signup because Password and Confirm Password do not match.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-014',
            module: 'Signup',
            feature: 'Referral Code Functionality',
            scenario: 'Referral Code is optional when available',
            preconditions: ['User on signup page'],
            steps: ['Inspect referral input', 'Assert field is optional and can be skipped'],
            expectedResult: 'Referral Code field exists and can be skipped.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-015',
            module: 'Signup',
            feature: 'End-to-End Account Creation',
            scenario: 'Create account with valid signup data',
            preconditions: ['User on signup page with valid credentials configured'],
            steps: ['Enter unique email and valid details', 'Click Create Account', 'Check success or OTP redirection'],
            expectedResult: 'Signup showed a successful account creation result.',
            priority: 'Critical',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-016',
            module: 'Signup',
            feature: 'Submission Controls',
            scenario: 'Create Account or Sign Up button should be available',
            preconditions: ['User on signup page'],
            steps: ['Locate Create Account button', 'Verify visible and enabled'],
            expectedResult: 'Create Account/Sign Up button is visible and enabled.',
            priority: 'High',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-017',
            module: 'Signup',
            feature: 'OAuth Registration',
            scenario: 'Google Signup option when available',
            preconditions: ['User on signup page'],
            steps: ['Check for Google Signup button'],
            expectedResult: 'Google Signup option is available when configured.',
            priority: 'Medium',
            testType: 'Positive',
          },
          {
            id: 'SIGNUP-018',
            module: 'Signup',
            feature: 'Security - XSS Prevention',
            scenario: 'Reject XSS payload in Full Name',
            preconditions: ['User on signup page'],
            steps: ['Enter script payload in Full Name', 'Submit form', 'Verify script does not execute dialog'],
            expectedResult: 'XSS payload in Full Name was not executed.',
            priority: 'Critical',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-019',
            module: 'Signup',
            feature: 'Security - SQL Injection Prevention',
            scenario: 'Reject SQL injection-like signup input',
            preconditions: ['User on signup page'],
            steps: ['Enter SQL payload in Full Name', 'Submit form', 'Assert user is not authenticated'],
            expectedResult: 'SQL injection-like signup input did not produce unauthorized access.',
            priority: 'Critical',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-020',
            module: 'Signup',
            feature: 'Email Sanitization',
            scenario: 'Reject invalid email format',
            preconditions: ['User on signup page'],
            steps: ['Enter email without domain', 'Submit form', 'Assert email rejected'],
            expectedResult: 'Invalid email format was rejected.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-021',
            module: 'Signup',
            feature: 'Security - Weak Password Prevention',
            scenario: 'Reject weak password',
            preconditions: ['User on signup page'],
            steps: ['Enter trivial 12345678 password', 'Submit form', 'Assert weak password rejected'],
            expectedResult: 'Weak password did not create an authenticated session.',
            priority: 'High',
            testType: 'Negative',
          },
          {
            id: 'SIGNUP-022',
            module: 'Signup',
            feature: 'Password Confirmation Verification',
            scenario: 'Reject mismatched password confirmation',
            preconditions: ['User on signup page'],
            steps: ['Enter mismatched passwords', 'Submit form', 'Assert confirmation rejection'],
            expectedResult: 'Mismatched password confirmation did not authenticate the user.',
            priority: 'High',
            testType: 'Negative',
          },
        ];

        for (const tc of signupCases) {
          testCases.push({
            ...tc,
            sourceFile: 'src/Development/pages/Auth/Signup/SignupForm.jsx',
          });
        }
      } else if (modKey === 'home') {
        testCases.push({
          id: 'HOME-001',
          module: 'Home',
          feature: 'Landing Page & Branding',
          scenario: 'Verify Happy Prancer landing page loads with top navigation and header',
          preconditions: ['Application is accessible at baseURL'],
          steps: ['Navigate to /', 'Verify navigation bar exists', 'Verify hero section loaded'],
          expectedResult: 'Landing page loads without error and displays navigation bar.',
          priority: 'Critical',
          testType: 'Positive',
          sourceFile: 'src/Development/pages/public/Home/index.jsx',
        });
        testCases.push({
          id: 'HOME-002',
          module: 'Home',
          feature: 'Navigation Flow',
          scenario: 'Verify navigation to Login page routes to /login',
          preconditions: ['Application is accessible at baseURL'],
          steps: ['Navigate to /', 'Click Login in navigation bar', 'Verify URL changes to /login'],
          expectedResult: 'User is smoothly routed to /login page.',
          priority: 'High',
          testType: 'Positive',
          sourceFile: 'src/Development/pages/public/Home/index.jsx',
        });
        testCases.push({
          id: 'HOME-003',
          module: 'Home',
          feature: 'Landing Sections',
          scenario: 'Verify Home page sections (Hero, Perks, FAQs) render properly',
          preconditions: ['Application is accessible at baseURL'],
          steps: ['Navigate to /', 'Assert Hero, Perks, and FAQs sections exist in DOM'],
          expectedResult: 'All primary landing sections are displayed without errors.',
          priority: 'Medium',
          testType: 'Positive',
          sourceFile: 'src/Development/pages/public/Home/index.jsx',
        });
      } else if (modKey === 'instructors') {
        testCases.push({
          id: 'INST-001',
          module: 'Instructors',
          feature: 'Instructor Directory',
          scenario: 'Verify instructors page displays list of dance instructors with details',
          preconditions: ['User navigates to /instructor'],
          steps: ['Navigate to /instructor', 'Verify instructor heading is visible', 'Verify instructor cards are rendered'],
          expectedResult: 'Instructor profiles and cards are visible on the page.',
          priority: 'High',
          testType: 'Positive',
          sourceFile: primaryFile,
        });
      } else if (modKey === 'gallery') {
        testCases.push({
          id: 'GAL-001',
          module: 'Gallery',
          feature: 'Visual Gallery & Accessibility',
          scenario: 'Verify gallery photos have descriptive alt attributes and render in grid',
          preconditions: ['User navigates to /gallery'],
          steps: ['Navigate to /gallery', 'Verify gallery heading is visible', 'Verify gallery images have non-empty alt text'],
          expectedResult: 'Gallery displays images with accessible descriptive alt text.',
          priority: 'Medium',
          testType: 'Positive',
          sourceFile: primaryFile,
        });
      } else if (modKey === 'schedule') {
        testCases.push({
          id: 'SCHED-001',
          module: 'Schedule',
          feature: 'Class Schedule Timetable',
          scenario: 'Verify schedule page displays upcoming dance classes and schedules',
          preconditions: ['User navigates to /schedule'],
          steps: ['Navigate to /schedule', 'Verify schedule container and classes are displayed'],
          expectedResult: 'Dance class schedule is displayed accurately.',
          priority: 'High',
          testType: 'Positive',
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
        affectedModules: Array.from(modulesToProcess),
        aiProvider: this.name,
      },
      testCases,
    };
  }
}

/**
 * Google Gemini API Provider:
 * Uses Google Generative Language REST API (Gemini 1.5 Flash / Pro) to generate structured test cases.
 */
export class GeminiAIProvider implements IAIProvider {
  name = 'gemini-ai';
  apiKey: string;
  model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || 'gemini-1.5-flash';
  }

  async generateTestCases(analysis: DiffAnalysisResult): Promise<TestCaseCollection> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.log('[ai-provider] GEMINI_API_KEY is not configured. Utilizing deterministic application heuristic engine.');
      return new HeuristicAIProvider().generateTestCases(analysis);
    }

    console.log(`[ai-provider] Invoking Gemini API (${this.model}) for modules: ${analysis.affectedModules.join(', ')}...`);

    const prompt = `You are a Senior Playwright QA Automation Engineer analyzing the Happy Prancer web application.
Based on the following Git diff and affected modules, generate a comprehensive JSON array of test cases.
Each test case must test REAL functionality in the codebase (Login: #login-email, #login-password, Google OAuth, Forgot Password; Signup: #signup-name, #signup-email, #signup-phone, #signup-password, #signup-referral, Create Account; Home: navigation, hero, perks, faqs).

Affected Modules: ${analysis.affectedModules.join(', ')}
Diff Summary:
${analysis.diffSnippet || 'Full application inspection mode'}

Output MUST be strictly valid JSON matching this schema:
{
  "testCases": [
    {
      "id": "LOGIN-001",
      "module": "Login",
      "feature": "Page Load & Rendering",
      "scenario": "Login page should load successfully",
      "preconditions": ["Application baseUrl is accessible"],
      "steps": ["Navigate to /login", "Verify email input visible", "Verify password input visible"],
      "testData": null,
      "expectedResult": "Email and password inputs are visible and ready for user entry.",
      "priority": "Critical",
      "testType": "Positive",
      "sourceFile": "src/Development/pages/Auth/Login/index.jsx"
    }
  ]
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API response did not contain candidates text.');
      }

      const parsed = JSON.parse(text);
      const generatedList = Array.isArray(parsed.testCases) ? parsed.testCases : [];

      if (generatedList.length === 0) {
        throw new Error('Gemini API returned 0 test cases.');
      }

      console.log(`[ai-provider] Gemini API successfully returned ${generatedList.length} test cases.`);

      return {
        metadata: {
          generatedAt: new Date().toISOString(),
          prNumber: process.env.PR_NUMBER || null,
          commitSha: process.env.GITHUB_SHA || null,
          targetBranch: analysis.targetBranch,
          totalCases: generatedList.length,
          affectedModules: analysis.affectedModules,
          aiProvider: `gemini (${this.model})`,
        },
        testCases: generatedList,
      };
    } catch (err) {
      console.warn(`[ai-provider] Gemini API invocation notice: ${(err as Error).message}. Gracefully falling back to code-grounded heuristic engine.`);
      return new HeuristicAIProvider().generateTestCases(analysis);
    }
  }
}

/**
 * Cloud LLM AI Provider (OpenAI Compatible)
 */
export class CloudLLMAIProvider implements IAIProvider {
  name: string;
  apiKey: string;
  model: string;
  endpoint: string;

  constructor(providerName: string, apiKey: string, model?: string) {
    this.name = providerName;
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async generateTestCases(analysis: DiffAnalysisResult): Promise<TestCaseCollection> {
    if (!this.apiKey) {
      return new HeuristicAIProvider().generateTestCases(analysis);
    }

    try {
      const prompt = `Analyze diff and generate test cases for Happy Prancer. Modules: ${analysis.affectedModules.join(', ')}`;
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
        throw new Error(`OpenAI HTTP ${response.status}`);
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
      console.warn(`[ai-provider] OpenAI LLM invocation error: ${(err as Error).message}. Falling back to heuristic engine.`);
      return new HeuristicAIProvider().generateTestCases(analysis);
    }
  }
}

/**
 * Factory to instantiate configured AI provider
 */
export function getAIProvider(): IAIProvider {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gemini-1.5-flash';

  if (provider === 'gemini' || geminiKey || provider === 'google') {
    return new GeminiAIProvider(geminiKey, model);
  }

  if (provider === 'openai') {
    return new CloudLLMAIProvider(provider, process.env.AI_API_KEY || '', process.env.AI_MODEL || 'gpt-4o-mini');
  }

  return new HeuristicAIProvider();
}
