# Happy Prancer AI Test Case Generation & Playwright Automation Guide

## 1. Overview & Architecture

This automation suite integrates:
1. **AI-Powered Test Case Generation**: Automatically analyzes Git diffs in Pull Requests targeting `test-workflow`, maps modified files to Happy Prancer application modules, and generates structured, schema-validated test cases.
2. **Playwright Script Generation**: Converts structured test cases into executable Playwright TypeScript tests using standard Page Object Models and accessible locators.
3. **Pre-Merge Validation**: Validates JSON schema, TypeScript syntax, and Playwright test discovery prior to execution, preventing malformed or untrusted code execution.
4. **Post-Merge Automated Testing**: Automatically triggers after merging into `test-workflow`, runs regression and approved suites against merged code, and publishes diagnostic Playwright HTML and Excel (`.xlsx`) reports.
5. **No External Deployed URL Dependency**: Preserves application security and stability by testing local and merged code directly without relying on external deployed endpoints.

---

## 2. Directory Layout

```text
happyprancer/
├── .github/
│   └── workflows/
│       ├── happyprancer-auth-tests.yml    # (Preserved legacy workflow)
│       ├── workflow.yml                   # (Preserved deployment workflow)
│       ├── ai-test-generation-pr.yml      # PR AI Generation & Script Validation
│       └── post-merge-automation.yml      # Post-Merge Regression & Reporting
├── automation/
│   ├── config/
│   │   └── automation.config.ts           # Module mapping & test thresholds
│   ├── docs/
│   │   ├── AUTOMATION_GUIDE.md            # Comprehensive documentation
│   │   └── PLAYWRIGHT_MCP.md              # Playwright MCP investigation & guide
│   ├── fixtures/
│   │   └── base.fixture.ts                # Page object fixtures & custom test hooks
│   ├── page-objects/
│   │   ├── BasePage.ts                    # Common navigation, wait, screenshot utilities
│   │   ├── LoginPage.ts                   # Login form POM (#login-email, #login-password)
│   │   ├── SignupPage.ts                  # Signup form POM (#signup-name, #signup-email)
│   │   ├── HomePage.ts                    # Landing hero, navbar, plans POM
│   │   ├── InstructorsPage.ts             # Instructors directory POM
│   │   ├── GalleryPage.ts                 # Gallery & alt text POM
│   │   └── DashboardPage.ts               # Sessions, attendance, rewards POM
│   ├── schemas/
│   │   └── test-case.schema.json          # JSON schema for validating test cases
│   ├── scripts/
│   │   ├── analyze-diff.ts                # Calculates diff & maps affected modules
│   │   ├── ai-provider.ts                 # Pluggable AI engine (Cloud LLM / Heuristic)
│   │   ├── generate-test-cases.ts         # Generates and validates test cases (JSON)
│   │   ├── generate-playwright.ts         # Converts JSON cases to Playwright specs (.ts)
│   │   ├── validate-generated-tests.ts    # JSON schema, syntax, discovery validator
│   │   └── export-excel-report.ts         # Formatted Excel (.xlsx) & markdown reporter
│   ├── test-cases/
│   │   ├── approved/                      # Manually reviewed/approved test cases
│   │   └── generated/                     # Latest AI-generated test cases
│   └── tests/
│       ├── e2e/                           # Baseline manual regression test specs
│       └── generated/                     # Auto-generated Playwright test specs
├── playwright.config.ts                   # Root Playwright test runner configuration
└── tsconfig.automation.json               # Dedicated automation TypeScript configuration
```

---

## 3. Supported Happy Prancer Modules

The diff analyzer (`automation/scripts/analyze-diff.ts`) maps code modifications to specific application modules using regex rules:

- **Login**: `src/Development/pages/Auth/Login/`, `ForgotPassword/`, `dev/`, `phone/`
- **Signup**: `src/Development/pages/Auth/Signup/`, `phone/`
- **Home**: `src/Development/pages/public/Home/`, `App.jsx`, navigation components
- **Instructors**: `src/Development/pages/public/Instructors/`, `InstructorCalendarPage/`
- **Gallery**: `src/Development/pages/public/Gallery/`
- **Schedule**: `src/Development/pages/public/Schedule/`
- **Upcoming Classes**: `src/Development/pages/private/Dashboard/UpcomingSessions/`, `Choreography/`
- **Previous Classes**: `src/Development/pages/private/Dashboard/PreviousSessions/`
- **Rewards**: `src/Development/pages/private/Dashboard/Rewards/`, `Leaderboard/`
- **Dashboard**: `src/Development/pages/private/Dashboard/`, `Attendance/`, `Subscriptions/`

---

## 4. Workflows & CI/CD Pipelines

### A. Pull Request Workflow (`ai-test-generation-pr.yml`)
- **Trigger**: Pull requests targeting `test-workflow` (`opened`, `reopened`, `synchronize`).
- **Actions**:
  1. Checks out PR code and fetches `test-workflow`.
  2. Compares Git diff between `test-workflow` and PR head.
  3. Generates structured test cases matching the JSON schema.
  4. Validates generated test cases using existing schema validation logic.
  5. Assesses environment availability and compiles TypeScript specs.
  6. Displays PR test cases summary in GitHub Actions step summary.
  7. Uploads test cases artifact (`pr-generated-test-cases`).

### B. Post-Merge Workflow (`post-merge-automation.yml`)
- **Trigger**: Push directly to `test-workflow` (upon PR merge).
- **Actions**:
  1. Checks out merged code from `test-workflow`.
  2. Installs Chromium browser dependencies.
  3. Retrieves PR generated test cases artifact or generates them from merge commit.
  4. Generates Playwright TypeScript specs (`generate-playwright.ts`).
  5. Validates generated Playwright scripts and test discovery.
  6. Executes Playwright test runner against HappyPrancer beta (`https://beta.happyprancer.com/`).
  7. Captures failure screenshots, videos, and diagnostic traces.
  8. Generates Playwright HTML report and formatted Excel spreadsheet.
  9. Uploads diagnostic reports and artifacts (`reports/`, `playwright-report/`, `test-results/`).
  10. Displays execution summary with status, pass/fail counts, and artifact locations.
  6. Generates Playwright HTML report and formatted Excel spreadsheet.
  7. Uploads diagnostic reports and artifacts (`reports/`, `playwright-report/`).

---

## 5. Configurable AI Provider

The AI generator is configurable via environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `AI_PROVIDER` | Provider type (`offline`, `openai`, `gemini`, `anthropic`) | `offline` |
| `AI_API_KEY` | Secret API key for cloud LLM provider | `""` (Empty) |
| `AI_MODEL` | Model identifier (e.g. `gpt-4o-mini`, `gemini-1.5-flash`) | `gpt-4o-mini` |

> **Offline Heuristic Guarantee**: When running in forks, public PRs, or environments without configured secrets, the system automatically uses the internal heuristic engine. This ensures CI pipelines run 100% reliably with zero external network dependencies or token costs.

---

## 6. Local Execution Commands

```bash
# 1. Compile automation scripts
npm run test:validate

# 2. Run full automation pipeline (diff -> test cases -> specs -> validation -> excel report)
npm run test:automation

# 3. Discover all Playwright tests
npx playwright test --list

# 4. Run Playwright tests with UI Mode
npm run test:playwright:ui

# 5. Open Playwright HTML Report
npm run test:playwright:report

# 6. Start Playwright MCP Server for interactive AI debugging
npm run mcp:playwright
```

---

## 7. Reports & Artifacts

1. **Excel Report (`reports/excel/HappyPrancer_Automation_Report.xlsx`)**:
   - **Execution Summary Sheet**: High-level metrics (Total, Passed, Failed, Skipped, Pass Rate %, Timestamp).
   - **Test Details Sheet**: Granular breakdown of each test (Test ID, Module, Feature, Scenario, Priority, Type, Status, Duration, Expected vs Actual, Error message).
   - **Color-Coded Statuses**: Green (Passed), Red (Failed), Yellow (Skipped), Gray (Standby).
2. **Playwright HTML Report (`playwright-report/index.html`)**:
   - Interactive report with step-by-step traces, console logs, network activity, and failure screenshots.
3. **Validation Summary (`reports/validation-summary.md`)**:
   - Concise GitHub step summary table displaying JSON schema, syntax, and discovery results.
