import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { TestCaseCollection, RawTestCase } from './ai-provider';

export type TestStatus = 'Pass' | 'Fail' | 'Blocked' | 'Not Executed' | 'Pending';

export interface FormattedExcelRow {
  testCaseId: string;
  feature: string;
  objective: string;
  expectedResult: string;
  actualResult: string;
  status: TestStatus;
  typeOfTesting: string;
  priority: string;
}

export interface ExcelReportOptions {
  mode: 'pr' | 'execution';
  outputFileName?: string;
  outputDir?: string;
  baseUrl?: string;
  targetBranch?: string;
}

/**
 * Strips ANSI terminal color codes and cleans stack traces for Excel display
 */
function cleanErrorMessage(msg?: string): string {
  if (!msg) return '';
  return msg
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

/**
 * Applies consistent professional formatting to the 8-column Test Cases worksheet
 */
function applyTableStyles(worksheet: ExcelJS.Worksheet) {
  // Freeze header row and enable gridlines
  worksheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];

  // Auto filter across the 8 columns
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 },
  };

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Navy Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.height = 26;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };

      // Alignments:
      // Col 1: Test Case ID -> center
      // Col 2: Feature -> left
      // Col 3: Objective -> left, wrapText
      // Col 4: Expected Result -> left, wrapText
      // Col 5: Actual Result -> left, wrapText
      // Col 6: Status -> center, bold
      // Col 7: Type of Testing -> center
      // Col 8: Priority -> center
      if (colNumber === 1 || colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: 'top', horizontal: 'center' };
      } else if (colNumber === 6) {
        cell.alignment = { vertical: 'top', horizontal: 'center' };
        const val = String(cell.value || '');
        if (val === 'Pass') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
        } else if (val === 'Fail') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
        } else if (val === 'Blocked') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF9A3412' } };
        } else if (val === 'Not Executed') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
        } else if (val === 'Pending') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
        }
      } else {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      }
    });
  });
}

/**
 * Generate Excel (.xlsx) Report using ExcelJS
 */
export async function exportExcelReport(options?: Partial<ExcelReportOptions>): Promise<string> {
  const mode: 'pr' | 'execution' =
    options?.mode ||
    (process.argv.includes('--pr') ? 'pr' : 'execution');

  const defaultFileName = mode === 'pr' ? 'PR_Test_Cases.xlsx' : 'Playwright_Execution_Report.xlsx';
  const fileName = options?.outputFileName || defaultFileName;
  const targetEnvironment = options?.baseUrl || process.env.BASE_URL || 'https://beta.happyprancer.com/';
  const targetBranch = options?.targetBranch || process.env.TARGET_BRANCH || 'test-workflow';

  console.log(`[export-excel-report] Generating Excel report in mode: ${mode} (${fileName})...`);

  const jsonCasesPath = path.resolve(process.cwd(), 'automation/test-cases/generated/latest-test-cases.json');
  const playwrightResultsPath = path.resolve(process.cwd(), 'reports/playwright-results.json');

  let collection: TestCaseCollection | null = null;
  if (fs.existsSync(jsonCasesPath)) {
    try {
      collection = JSON.parse(fs.readFileSync(jsonCasesPath, 'utf-8'));
    } catch (err) {
      console.warn('[export-excel-report] Warning: Unable to parse test cases JSON:', (err as Error).message);
    }
  }

  let playwrightResults: any = null;
  if (mode === 'execution' && fs.existsSync(playwrightResultsPath)) {
    try {
      playwrightResults = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf-8'));
    } catch (err) {
      console.warn('[export-excel-report] Warning: Unable to parse Playwright results JSON:', (err as Error).message);
    }
  }

  // Parse Playwright test execution results
  const executedTestMap = new Map<string, { status: string; duration: number; error?: string }>();
  if (playwrightResults && playwrightResults.suites) {
    function traverseSuites(suites: any[]) {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            const title = spec.title || '';
            const match = title.match(/^(TC-[A-Z0-9]+-[0-9]{3,}|TC-[A-Z0-9]+-REG-[0-9]{3,})/i);
            const id = match ? match[1].toUpperCase() : title;

            const testResult = spec.tests?.[0]?.results?.[0];
            const rawStatus = (testResult?.status || 'unknown').toLowerCase();
            const duration = testResult?.duration || 0;
            const error = testResult?.error?.message || testResult?.errors?.[0]?.message;

            let mappedStatus: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED' = 'SKIPPED';
            if (rawStatus === 'passed') {
              mappedStatus = 'PASSED';
            } else if (rawStatus === 'failed' || rawStatus === 'timedout') {
              mappedStatus = 'FAILED';
            } else if (rawStatus === 'interrupted') {
              mappedStatus = 'BLOCKED';
            } else if (rawStatus === 'skipped') {
              mappedStatus = 'SKIPPED';
            }

            executedTestMap.set(id, {
              status: mappedStatus,
              duration,
              error,
            });
          }
        }
        if (suite.suites) {
          traverseSuites(suite.suites);
        }
      }
    }
    traverseSuites(playwrightResults.suites);
  }

  // Build the unified 8-column records
  const records: FormattedExcelRow[] = [];
  const testCases: RawTestCase[] = collection?.testCases || [];

  if (mode === 'pr') {
    // PR Mode: Newly generated test cases that have not yet been executed
    for (const tc of testCases) {
      records.push({
        testCaseId: tc.id,
        feature: tc.feature || tc.module,
        objective: tc.scenario,
        expectedResult: tc.expectedResult,
        actualResult: 'Not Executed',
        status: 'Pending',
        typeOfTesting: tc.testType || 'Positive',
        priority: tc.priority || 'Medium',
      });
    }
  } else {
    // Post-Merge Execution Mode: Actual Playwright execution results
    for (const tc of testCases) {
      const exec = executedTestMap.get(tc.id.toUpperCase());

      let status: TestStatus = 'Not Executed';
      let actualResult = 'Not Executed: Awaiting test runner execution.';

      if (exec) {
        if (exec.status === 'PASSED') {
          status = 'Pass';
          actualResult = `Pass: Test executed and verified successfully against ${targetEnvironment} (${exec.duration}ms).`;
        } else if (exec.status === 'FAILED') {
          status = 'Fail';
          const cleanErr = cleanErrorMessage(exec.error);
          actualResult = `Fail: ${cleanErr || 'Assertion failed during Playwright test execution.'} (${exec.duration}ms)`;
        } else if (exec.status === 'BLOCKED') {
          status = 'Blocked';
          actualResult = `Blocked: Test execution was interrupted or dependent precondition was not met.`;
        } else if (exec.status === 'SKIPPED') {
          status = 'Not Executed';
          actualResult = `Not Executed: Test was skipped by test runner.`;
        }
      } else {
        status = 'Not Executed';
        actualResult = 'Not Executed: Test case generated but was not scheduled or executed in this run.';
      }

      records.push({
        testCaseId: tc.id,
        feature: tc.feature || tc.module,
        objective: tc.scenario,
        expectedResult: tc.expectedResult,
        actualResult,
        status,
        typeOfTesting: tc.testType || 'Positive',
        priority: tc.priority || 'Medium',
      });
    }

    // Include any baseline regression tests from Playwright execution not in AI collection
    for (const [id, exec] of executedTestMap.entries()) {
      if (!records.some((r) => r.testCaseId.toUpperCase() === id.toUpperCase())) {
        let status: TestStatus = 'Not Executed';
        let actualResult = 'Not Executed: Regression test skipped.';

        if (exec.status === 'PASSED') {
          status = 'Pass';
          actualResult = `Pass: Regression assertion verified cleanly (${exec.duration}ms).`;
        } else if (exec.status === 'FAILED') {
          status = 'Fail';
          actualResult = `Fail: ${cleanErrorMessage(exec.error) || 'Regression assertion failed.'}`;
        } else if (exec.status === 'BLOCKED') {
          status = 'Blocked';
          actualResult = 'Blocked: Prerequisite setup or execution blocked.';
        }

        records.push({
          testCaseId: id,
          feature: 'Regression Suite',
          objective: `Verify baseline regression scenario: ${id}`,
          expectedResult: 'Regression check passes successfully without errors.',
          actualResult,
          status,
          typeOfTesting: 'Regression',
          priority: 'High',
        });
      }
    }
  }

  // Workbook initialization
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Happy Prancer Automation';
  workbook.created = new Date();

  // Define exact 8 columns structure
  const columns = [
    { header: 'Test Case ID', key: 'testCaseId', width: 18 },
    { header: 'Feature', key: 'feature', width: 24 },
    { header: 'Objective', key: 'objective', width: 42 },
    { header: 'Expected Result', key: 'expectedResult', width: 42 },
    { header: 'Actual Result', key: 'actualResult', width: 45 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Type of Testing', key: 'typeOfTesting', width: 18 },
    { header: 'Priority', key: 'priority', width: 14 },
  ];

  // In Execution mode, add 'Execution Summary' sheet first
  let total = records.length;
  let passed = records.filter((r) => r.status === 'Pass').length;
  let failed = records.filter((r) => r.status === 'Fail').length;
  let blocked = records.filter((r) => r.status === 'Blocked').length;
  let notExecuted = records.filter((r) => r.status === 'Not Executed').length;
  let pending = records.filter((r) => r.status === 'Pending').length;
  let passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%';

  if (mode === 'execution') {
    const summarySheet = workbook.addWorksheet('Execution Summary', {
      views: [{ showGridLines: true }],
    });

    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 32 },
      { header: 'Value', key: 'value', width: 45 },
    ];

    const summaryData = [
      { metric: 'Execution Date and Time', value: new Date().toISOString().replace('T', ' ').replace(/\..+/, ' UTC') },
      { metric: 'Target Environment URL', value: targetEnvironment },
      { metric: 'Target Branch', value: targetBranch },
      { metric: 'Total Test Cases', value: total },
      { metric: 'Passed Test Cases', value: passed },
      { metric: 'Failed Test Cases', value: failed },
      { metric: 'Blocked Test Cases', value: blocked },
      { metric: 'Not Executed Test Cases', value: notExecuted },
      { metric: 'Pass Percentage', value: passRate },
      { metric: 'Overall Status', value: failed > 0 ? 'FAIL' : passed > 0 && passed === total ? 'PASS' : 'WARNING' },
    ];

    summaryData.forEach((row) => summarySheet.addRow(row));

    // Style Summary Sheet Header
    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.height = 28;
    summaryHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    summaryHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    summarySheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 22;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        if (colNumber === 1) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
        }
      });
    });
  }

  // Worksheet: 'Test Cases'
  const testCasesSheet = workbook.addWorksheet('Test Cases');
  testCasesSheet.columns = columns;

  records.forEach((rec) => {
    testCasesSheet.addRow(rec);
  });

  applyTableStyles(testCasesSheet);

  // Write output workbook
  const outputDir = options?.outputDir || path.resolve(process.cwd(), 'reports/excel');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFilePath = path.join(outputDir, fileName);
  await workbook.xlsx.writeFile(outputFilePath);

  console.log(`[export-excel-report] Successfully exported Excel workbook to: ${outputFilePath}`);

  // Also in PR mode, copy to automation/test-cases/generated/PR_Test_Cases.xlsx
  if (mode === 'pr') {
    const generatedDir = path.resolve(process.cwd(), 'automation/test-cases/generated');
    if (fs.existsSync(generatedDir)) {
      const copyTarget = path.join(generatedDir, fileName);
      fs.copyFileSync(outputFilePath, copyTarget);
      console.log(`[export-excel-report] Copied PR workbook to: ${copyTarget}`);
    }
  }

  // Publish step summary markdown
  const summaryMd = mode === 'pr'
    ? `### 📋 Happy Prancer PR Generated Test Cases (Excel Report)

- **Total Generated Cases**: ${total}
- **Status**: All marked \`Pending\` (Awaiting live beta execution after merge)
- **Target Branch**: \`${targetBranch}\`
- **Excel Report File**: \`${fileName}\`
`
    : `### 📊 Happy Prancer Playwright Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Execution Status** | **${failed > 0 ? '❌ FAIL' : '✅ PASS'}** |
| **Target Branch** | \`${targetBranch}\` |
| **Target Environment** | ${targetEnvironment} |
| **Total Test Cases** | ${total} |
| **Passed Test Cases** | ${passed} ✅ |
| **Failed Test Cases** | ${failed} ❌ |
| **Blocked Test Cases** | ${blocked} ⚠️ |
| **Not Executed Test Cases** | ${notExecuted} ⏳ |
| **Pass Percentage** | **${passRate}** |

#### 📁 Generated Reports & Artifacts
- **Excel Execution Report**: \`reports/excel/${fileName}\`
- **Playwright HTML Report**: \`playwright-report/index.html\`
- **Playwright JSON Results**: \`reports/playwright-results.json\`
- **Execution Artifacts (Videos/Traces/Screenshots)**: \`test-results/\`
`;

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(reportsDir, mode === 'pr' ? 'pr-test-cases-summary.md' : 'execution-summary.md'), summaryMd);

  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary) {
    fs.appendFileSync(stepSummary, `\n${summaryMd}\n`);
  }

  console.log(summaryMd);

  return outputFilePath;
}

if (require.main === module) {
  exportExcelReport().catch((err) => {
    console.error('[export-excel-report] Error:', err);
    process.exit(1);
  });
}
