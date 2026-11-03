import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { HAPPY_PRANCER_MODULES, ModuleMapping } from '../config/automation.config';

export interface ChangedFile {
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
  file: string;
  mappedModule?: string;
}

export interface DiffAnalysisResult {
  baseBranch: string;
  targetBranch: string;
  timestamp: string;
  changedFiles: ChangedFile[];
  affectedModules: string[];
  moduleDetails: {
    [moduleKey: string]: {
      name: string;
      category: string;
      route: string;
      files: string[];
      pageObject: string;
    };
  };
  diffSnippet: string;
}

/**
 * Identify git changes against a target branch or local working tree
 */
export function analyzeDiff(targetBranch?: string): DiffAnalysisResult {
  const resolvedTarget = targetBranch || process.env.TARGET_BRANCH || 'origin/dev';
  let gitDiffOutput = '';
  let nameStatusOutput = '';

  try {
    // Check if target branch reference exists locally or in origin
    let branchRef = resolvedTarget;
    try {
      execSync(`git rev-parse --verify ${branchRef}`, { stdio: 'pipe' });
    } catch {
      branchRef = `origin/${resolvedTarget}`;
      execSync(`git rev-parse --verify ${branchRef}`, { stdio: 'pipe' });
    }
    nameStatusOutput = execSync(`git diff --name-status ${branchRef}...HEAD`, { encoding: 'utf-8' });
    gitDiffOutput = execSync(`git diff ${branchRef}...HEAD --unified=3`, { encoding: 'utf-8' });
  } catch (err) {
    console.warn(`Git diff comparison against ${resolvedTarget} failed, falling back to local diff:`, (err as Error).message);
    try {
      nameStatusOutput = execSync(`git status --porcelain`, { encoding: 'utf-8' });
      gitDiffOutput = execSync(`git diff HEAD --unified=3`, { encoding: 'utf-8' });
    } catch {
      nameStatusOutput = '';
    }
  }

  const changedFiles: ChangedFile[] = [];
  const lines = nameStatusOutput.split('\n').filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      let statusCode = parts[0].toUpperCase();
      let filePath = parts.slice(1).join(' ').replace(/\\/g, '/');

      // If status code is from git status --porcelain (e.g. "M", "??", "A", "D")
      let status: ChangedFile['status'] = 'modified';
      if (statusCode.includes('A') || statusCode === '??') status = 'added';
      else if (statusCode.includes('D')) status = 'deleted';
      else if (statusCode.includes('R')) status = 'renamed';
      else if (statusCode.includes('M')) status = 'modified';

      changedFiles.push({ status, file: filePath });
    }
  }

  // If no files detected in diff (e.g. running on clean branch), include core modules as regression baseline
  const affectedModulesSet = new Set<string>();
  const moduleDetails: DiffAnalysisResult['moduleDetails'] = {};

  for (const changed of changedFiles) {
    for (const [key, mapping] of Object.entries(HAPPY_PRANCER_MODULES)) {
      const isMatch = mapping.patterns.some((pattern) => pattern.test(changed.file));
      if (isMatch) {
        changed.mappedModule = key;
        affectedModulesSet.add(key);

        if (!moduleDetails[key]) {
          moduleDetails[key] = {
            name: mapping.name,
            category: mapping.category,
            route: mapping.route,
            files: [],
            pageObject: mapping.pageObject,
          };
        }
        moduleDetails[key].files.push(changed.file);
      }
    }
  }

  // If no specific module changed, default to core modules for comprehensive regression
  if (affectedModulesSet.size === 0) {
    affectedModulesSet.add('login');
    affectedModulesSet.add('signup');
    affectedModulesSet.add('home');
    moduleDetails['login'] = {
      name: HAPPY_PRANCER_MODULES.login.name,
      category: HAPPY_PRANCER_MODULES.login.category,
      route: HAPPY_PRANCER_MODULES.login.route,
      files: ['src/Development/pages/Auth/Login/index.jsx'],
      pageObject: HAPPY_PRANCER_MODULES.login.pageObject,
    };
    moduleDetails['signup'] = {
      name: HAPPY_PRANCER_MODULES.signup.name,
      category: HAPPY_PRANCER_MODULES.signup.category,
      route: HAPPY_PRANCER_MODULES.signup.route,
      files: ['src/Development/pages/Auth/Signup/SignupForm.jsx'],
      pageObject: HAPPY_PRANCER_MODULES.signup.pageObject,
    };
    moduleDetails['home'] = {
      name: HAPPY_PRANCER_MODULES.home.name,
      category: HAPPY_PRANCER_MODULES.home.category,
      route: HAPPY_PRANCER_MODULES.home.route,
      files: ['src/Development/pages/public/Home/index.jsx'],
      pageObject: HAPPY_PRANCER_MODULES.home.pageObject,
    };
  }

  const result: DiffAnalysisResult = {
    baseBranch: resolvedTarget,
    targetBranch: resolvedTarget,
    timestamp: new Date().toISOString(),
    changedFiles,
    affectedModules: Array.from(affectedModulesSet),
    moduleDetails,
    diffSnippet: gitDiffOutput.slice(0, 8000), // Cap snippet to avoid token limits
  };

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(reportsDir, 'diff-analysis.json'), JSON.stringify(result, null, 2));
  console.log(`[analyze-diff] Identified ${changedFiles.length} changed files across modules: ${result.affectedModules.join(', ')}`);

  return result;
}

if (require.main === module) {
  const target = process.argv[2] || process.env.TARGET_BRANCH || 'origin/dev';
  analyzeDiff(target);
}
