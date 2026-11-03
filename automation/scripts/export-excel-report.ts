import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { TestCaseCollection, RawTestCase } from './ai-provider';

export interface TestExecutionRecord {
  testId: string;
  module: string;
  feature: string;
  scenario: string;
  priority: string;
  testType: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'NOT_RUN';
  durationMs: number;
  expectedResult: string;
  actualResult: string;
  errorMessage?: string;
  sourceFile: string;
}

/**
 * Generate Excel (.xlsx) Report using ExcelJS
 */
export async function exportExcelReport(): Promise<string> {
  console.log('[export-excel-report] Compiling execution records and generating Excel report...');

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
  if (fs.existsSync(playwrightResultsPath)) {
    try {
      playwrightResults = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf-8'));
    } catch (err) {
      console.warn('[export-excel-report] Warning: Unable to parse Playwright results JSON:', (err as Error).message);
    }
  }

  // Parse Playwright tests map
  const executedTestMap = new Map<string, { status: string; duration: number; error?: string }>();
  if (playwrightResults && playwrightResults.suites) {
    function traverseSuites(suites: any[]) {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            const title = spec.title || '';
            const match = title.match(/^(TC-[A-Z0-9]+-[0-9]{3,})/i);
            const id = match ? match[1].toUpperCase() : title;

            // Extract last test execution run
            const testResult = spec.tests?.[0]?.results?.[0];
            const status = testResult?.status?.toUpperCase() || 'UNKNOWN';
            const duration = testResult?.duration || 0;
            const error = testResult?.error?.message || testResult?.errors?.[0]?.message;

            executedTestMap.set(id, {
              status: status === 'PASSED' ? 'PASSED' : status === 'TIMEDOUT' || status === 'FAILED' ? 'FAILED' : 'SKIPPED',
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

  // Build unified records
  const records: TestExecutionRecord[] = [];
  const testCases: RawTestCase[] = collection?.testCases || [];

  if (testCases.length > 0) {
    for (const tc of testCases) {
      const exec = executedTestMap.get(tc.id.toUpperCase());
      const status = exec ? (exec.status as any) : 'NOT_RUN';
      const durationMs = exec ? exec.duration : 0;
      const actualResult =
        status === 'PASSED'
          ? 'Passed: ' + tc.expectedResult
          : status === 'FAILED'
          ? `Failed: ${exec?.error || 'Assertion failed'}`
          : status === 'SKIPPED'
          ? 'Skipped during execution'
          : 'Validated: Awaiting live server execution';

      records.push({
        testId: tc.id,
        module: tc.module,
        feature: tc.feature,
        scenario: tc.scenario,
        priority: tc.priority,
        testType: tc.testType,
        status,
        durationMs,
        expectedResult: tc.expectedResult,
        actualResult,
        errorMessage: exec?.error,
        sourceFile: tc.sourceFile,
      });
    }
  }

  // Also add any regression tests from Playwright that were not in AI collection
  for (const [id, exec] of executedTestMap.entries()) {
    if (!records.some((r) => r.testId.toUpperCase() === id.toUpperCase())) {
      records.push({
        testId: id,
        module: 'Regression Baseline',
        feature: 'Regression Suite',
        scenario: id,
        priority: 'High',
        testType: 'Regression',
        status: exec.status as any,
        durationMs: exec.duration,
        expectedResult: 'Regression check passes successfully',
        actualResult: exec.status === 'PASSED' ? 'Passed' : `Failed: ${exec.error || ''}`,
        errorMessage: exec.error,
        sourceFile: 'automation/tests/e2e',
      });
    }
  }

  // Workbook initialization
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Happy Prancer Automation';
  workbook.created = new Date();

  // SHEET 1: Summary Dashboard
  const summarySheet = workbook.addWorksheet('Execution Summary', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 40 },
  ];

  const total = records.length;
  const passed = records.filter((r) => r.status === 'PASSED').length;
  const failed = records.filter((r) => r.status === 'FAILED').length;
  const skipped = records.filter((r) => r.status === 'SKIPPED').length;
  const notRun = records.filter((r) => r.status === 'NOT_RUN').length;
  const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : 'N/A';

  const summaryData = [
    { metric: 'Project Name', value: 'Happy Prancer Test Automation' },
    { metric: 'Execution Timestamp', value: new Date().toISOString() },
    { metric: 'Target Branch', value: collection?.metadata?.targetBranch || 'dev' },
    { metric: 'AI Generator Provider', value: collection?.metadata?.aiProvider || 'offline' },
    { metric: 'Total Test Cases', value: total },
    { metric: 'Passed Tests', value: passed },
    { metric: 'Failed Tests', value: failed },
    { metric: 'Skipped Tests', value: skipped },
    { metric: 'Pending / Not Run', value: notRun },
    { metric: 'Pass Rate', value: passRate },
    { metric: 'Execution Environment', value: process.env.BASE_URL || 'http://localhost:3000' },
  ];

  summaryData.forEach((row) => summarySheet.addRow(row));

  // Style header row
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Blue
  };

  // SHEET 2: Test Details
  const detailsSheet = workbook.addWorksheet('Test Details', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });

  detailsSheet.columns = [
    { header: 'Test ID', key: 'testId', width: 18 },
    { header: 'Module', key: 'module', width: 16 },
    { header: 'Feature', key: 'feature', width: 25 },
    { header: 'Scenario', key: 'scenario', width: 45 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Type', key: 'testType', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Duration (ms)', key: 'durationMs', width: 14 },
    { header: 'Expected Result', key: 'expectedResult', width: 45 },
    { header: 'Actual Result', key: 'actualResult', width: 45 },
    { header: 'Error Details', key: 'errorMessage', width: 40 },
    { header: 'Source File', key: 'sourceFile', width: 35 },
  ];

  detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  detailsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' },
  };

  records.forEach((rec) => {
    const row = detailsSheet.addRow(rec);
    const statusCell = row.getCell('status');

    if (rec.status === 'PASSED') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }, // Soft Emerald Green
      };
      statusCell.font = { bold: true, color: { argb: 'FF065F46' } };
    } else if (rec.status === 'FAILED') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' }, // Soft Red
      };
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    } else if (rec.status === 'SKIPPED') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }, // Soft Yellow
      };
      statusCell.font = { bold: true, color: { argb: 'FF92400E' } };
    } else {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }, // Neutral Gray
      };
      statusCell.font = { color: { argb: 'FF374151' } };
    }
  });

  const excelDir = path.resolve(process.cwd(), 'reports/excel');
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, { recursive: true });
  }

  const outputFilePath = path.join(excelDir, 'HappyPrancer_Automation_Report.xlsx');
  await workbook.xlsx.writeFile(outputFilePath);

  console.log(`[export-excel-report] Successfully exported Excel report to: ${outputFilePath}`);

  // Also write concise markdown summary
  const summaryMd = `### 📊 Happy Prancer Automation Execution Report

- **Total Tests**: ${total}
- **Passed**: ${passed} ✅
- **Failed**: ${failed} ❌
- **Skipped**: ${skipped} ⚠️
- **Not Run / Standby**: ${notRun} ⏳
- **Pass Rate**: **${passRate}**
- **Excel Report**: Saved to \`${outputFilePath}\`
`;

  const reportsDir = path.resolve(process.cwd(), 'reports');
  fs.writeFileSync(path.join(reportsDir, 'execution-summary.md'), summaryMd);

  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary) {
    fs.appendFileSync(stepSummary, `\n${summaryMd}\n`);
  }

  return outputFilePath;
}

if (require.main === module) {
  exportExcelReport().catch((err) => {
    console.error('[export-excel-report] Error:', err);
    process.exit(1);
  });
}
