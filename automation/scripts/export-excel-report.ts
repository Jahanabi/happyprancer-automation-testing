import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { TestCaseCollection, RawTestCase } from './ai-provider';

export type TestStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT EXECUTED';

export interface FormattedExcelRow {
  testCaseId: string;
  feature: string;
  objective: string;
  expectedResult: string;
  actualResult?: string;
  status?: TestStatus;
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
 * Applies consistent professional styling to the Test Cases worksheet
 */
function applyTableStyles(worksheet: ExcelJS.Worksheet, columnCount: number) {
  // Freeze header row and enable gridlines
  worksheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];

  // Auto filter across the columns
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columnCount },
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

      if (colNumber === 1) {
        // Test Case ID
        cell.alignment = { vertical: 'top', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 6) {
        // Status Column in 6-column execution mode
        cell.alignment = { vertical: 'top', horizontal: 'center' };
        const val = String(cell.value || '').toUpperCase();
        if (val === 'PASS') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
        } else if (val === 'FAIL') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
        } else if (val === 'SKIPPED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF9A3412' } };
        } else if (val === 'NOT EXECUTED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
        }
      } else {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      }
    });
  });
}

/**
 * Generate Excel (.xlsx) Report:
 * Pre-Merge Mode: 4 columns (| Test Case ID | Feature | Objective | Expected Result |)
 * Post-Merge Mode: 6 columns (| Test Case ID | Feature | Objective | Expected Result | Actual Result | Status |)
 */
export async function exportExcelReport(options?: Partial<ExcelReportOptions>): Promise<string> {
  const mode: 'pr' | 'execution' =
    options?.mode || (process.argv.includes('--pr') ? 'pr' : 'execution');

  const defaultFileName = mode === 'pr' ? 'PR_Test_Cases.xlsx' : 'playwright-execution-report.xlsx';
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
  const executedTestMap = new Map<string, { status: 'PASSED' | 'FAILED' | 'SKIPPED'; duration: number; error?: string }>();

  if (playwrightResults && playwrightResults.suites) {
    function traverseSuites(suites: any[]) {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            const title = spec.title || '';
            const match = title.match(/^([A-Z0-9_-]+)\s*[-:]/i) || title.match(/^([A-Z0-9]+-[0-9]{3,})/i);
            const id = match ? match[1].trim().toUpperCase() : title.trim();

            const testResult = spec.tests?.[0]?.results?.[0];
            const rawStatus = (testResult?.status || 'unknown').toLowerCase();
            const duration = testResult?.duration || 0;
            const error = testResult?.error?.message || testResult?.errors?.[0]?.message;

            let mappedStatus: 'PASSED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
            if (rawStatus === 'passed') {
              mappedStatus = 'PASSED';
            } else if (rawStatus === 'failed' || rawStatus === 'timedout') {
              mappedStatus = 'FAILED';
            } else {
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

  const records: FormattedExcelRow[] = [];
  const testCases: RawTestCase[] = collection?.testCases || [];

  if (mode === 'pr') {
    // Pre-Merge PR Mode: 4 columns (| Test Case ID | Feature | Objective | Expected Result |)
    for (const tc of testCases) {
      records.push({
        testCaseId: tc.id,
        feature: tc.feature || tc.module,
        objective: tc.scenario,
        expectedResult: tc.expectedResult,
      });
    }
  } else {
    // Post-Merge Execution Mode: 6 columns (| Test Case ID | Feature | Objective | Expected Result | Actual Result | Status |)
    for (const tc of testCases) {
      const tcKey = tc.id.toUpperCase();
      const exec = executedTestMap.get(tcKey);

      let status: TestStatus = 'NOT EXECUTED';
      let actualResult = 'NOT EXECUTED: Test case generated but was not scheduled or executed in this run.';

      if (exec) {
        if (exec.status === 'PASSED') {
          status = 'PASS';
          actualResult = `PASS: Test executed and verified successfully against ${targetEnvironment} (${exec.duration}ms).`;
        } else if (exec.status === 'FAILED') {
          status = 'FAIL';
          const cleanErr = cleanErrorMessage(exec.error);
          actualResult = `FAIL: ${cleanErr || 'Assertion failed during Playwright test execution.'} (${exec.duration}ms)`;
        } else if (exec.status === 'SKIPPED') {
          status = 'SKIPPED';
          actualResult = `SKIPPED: Test was skipped by test runner (${cleanErrorMessage(exec.error) || 'Prerequisite not configured'}).`;
        }
      }

      records.push({
        testCaseId: tc.id,
        feature: tc.feature || tc.module,
        objective: tc.scenario,
        expectedResult: tc.expectedResult,
        actualResult,
        status,
      });
    }

    // Include any executed baseline regression tests
    for (const [id, exec] of executedTestMap.entries()) {
      if (!records.some((r) => r.testCaseId.toUpperCase() === id.toUpperCase())) {
        let status: TestStatus = 'NOT EXECUTED';
        let actualResult = 'NOT EXECUTED: Test skipped.';

        if (exec.status === 'PASSED') {
          status = 'PASS';
          actualResult = `PASS: Verified cleanly (${exec.duration}ms).`;
        } else if (exec.status === 'FAILED') {
          status = 'FAIL';
          actualResult = `FAIL: ${cleanErrorMessage(exec.error) || 'Test assertion failed.'}`;
        } else if (exec.status === 'SKIPPED') {
          status = 'SKIPPED';
          actualResult = 'SKIPPED: Test skipped during execution.';
        }

        records.push({
          testCaseId: id,
          feature: id.startsWith('LOGIN') ? 'Login' : id.startsWith('SIGNUP') ? 'Signup' : 'Playwright Suite',
          objective: `Verify scenario for ${id}`,
          expectedResult: 'Scenario executes and passes validation successfully.',
          actualResult,
          status,
        });
      }
    }
  }

  // Workbook initialization
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Happy Prancer Automation';
  workbook.created = new Date();

  // Define column structure based on mode
  const columns =
    mode === 'pr'
      ? [
          { header: 'Test Case ID', key: 'testCaseId', width: 18 },
          { header: 'Feature', key: 'feature', width: 28 },
          { header: 'Objective', key: 'objective', width: 48 },
          { header: 'Expected Result', key: 'expectedResult', width: 48 },
        ]
      : [
          { header: 'Test Case ID', key: 'testCaseId', width: 18 },
          { header: 'Feature', key: 'feature', width: 26 },
          { header: 'Objective', key: 'objective', width: 45 },
          { header: 'Expected Result', key: 'expectedResult', width: 45 },
          { header: 'Actual Result', key: 'actualResult', width: 50 },
          { header: 'Status', key: 'status', width: 18 },
        ];

  // In Execution mode, add 'Execution Summary' sheet first
  const total = records.length;
  const passed = records.filter((r) => r.status === 'PASS').length;
  const failed = records.filter((r) => r.status === 'FAIL').length;
  const skipped = records.filter((r) => r.status === 'SKIPPED').length;
  const notExecuted = records.filter((r) => r.status === 'NOT EXECUTED').length;
  const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%';

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
      { metric: 'Passed Test Cases (PASS)', value: passed },
      { metric: 'Failed Test Cases (FAIL)', value: failed },
      { metric: 'Skipped Test Cases (SKIPPED)', value: skipped },
      { metric: 'Not Executed Test Cases (NOT EXECUTED)', value: notExecuted },
      { metric: 'Pass Percentage', value: passRate },
      { metric: 'Overall Status', value: failed > 0 ? 'FAIL' : passed > 0 && passed === total ? 'PASS' : 'WARNING' },
    ];

    summaryData.forEach((row) => summarySheet.addRow(row));

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

  applyTableStyles(testCasesSheet, columns.length);

  // Write output workbook
  const outputDir = options?.outputDir || path.resolve(process.cwd(), 'reports/excel');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFilePath = path.join(outputDir, fileName);
  await workbook.xlsx.writeFile(outputFilePath);

  console.log(`[export-excel-report] Successfully exported Excel workbook to: ${outputFilePath}`);

  // In execution mode, sync to Playwright_Execution_Report.xlsx and playwright-test-report.xlsx
  if (mode === 'execution') {
    const alias1 = path.join(outputDir, 'Playwright_Execution_Report.xlsx');
    const alias2 = path.join(outputDir, 'playwright-test-report.xlsx');
    fs.copyFileSync(outputFilePath, alias1);
    fs.copyFileSync(outputFilePath, alias2);
    console.log(`[export-excel-report] Synced execution report to: ${alias1} and ${alias2}`);
  }

  // In PR mode, also copy to automation/test-cases/generated/PR_Test_Cases.xlsx
  if (mode === 'pr') {
    const generatedDir = path.resolve(process.cwd(), 'automation/test-cases/generated');
    if (fs.existsSync(generatedDir)) {
      const copyTarget = path.join(generatedDir, fileName);
      fs.copyFileSync(outputFilePath, copyTarget);
      console.log(`[export-excel-report] Copied PR workbook to: ${copyTarget}`);
    }
  }

  // Publish step summary markdown
  const summaryMd =
    mode === 'pr'
      ? `### 📋 Happy Prancer PR Generated Test Cases (Pre-Merge Excel Report)

- **Total Generated Cases**: ${total}
- **Format**: Exact 4 Columns (\`Test Case ID\`, \`Feature\`, \`Objective\`, \`Expected Result\`)
- **Target Branch**: \`${targetBranch}\`
- **Excel Report File**: \`${fileName}\`
`
      : `### 📊 Happy Prancer Playwright Test Execution Summary (Post-Merge Excel Report)

| Metric | Value |
| :--- | :--- |
| **Execution Status** | **${failed > 0 ? '❌ FAIL' : '✅ PASS'}** |
| **Target Branch** | \`${targetBranch}\` |
| **Target Environment** | ${targetEnvironment} |
| **Total Test Cases** | ${total} |
| **Passed Test Cases** | ${passed} ✅ |
| **Failed Test Cases** | ${failed} ❌ |
| **Skipped Test Cases** | ${skipped} ⚠️ |
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
  fs.writeFileSync(
    path.join(reportsDir, mode === 'pr' ? 'pr-test-cases-summary.md' : 'execution-summary.md'),
    summaryMd
  );

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
