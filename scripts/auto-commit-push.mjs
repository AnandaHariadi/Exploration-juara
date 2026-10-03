#!/usr/bin/env node

/**
 * scripts/auto-commit-push.mjs
 *
 * Automated Atomic Semantic Commit & Push Script
 * - Detects every small file change individually
 * - Categorizes and generates strict Semantic Commit Messages (feat, fix, refactor, chore, docs, test, style)
 * - Commits changes atomically (1 commit per file) to keep git history granular
 * - Auto-creates and checks out a new feature branch if on main/staging
 * - Pushes upstream to https://github.com/AnandaHariadi/Exploration-juara
 * - Supports one-shot execution (--now) and continuous watch mode (--watch)
 */

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import process from 'process';

// ANSI colors for clean terminal logs
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function log(prefix, msg, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${color}${prefix}${colors.reset} ${msg}`);
}

function runGit(command, options = {}) {
  try {
    const out = execSync(`git ${command}`, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      ...options,
    });
    return options.noTrim ? out : out.trim();
  } catch (err) {
    if (options.ignoreError) return '';
    throw err;
  }
}

function runGitArgs(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
    ...options,
  });
  if (result.status !== 0 && !options.ignoreError) {
    const errorMsg = result.stderr ? result.stderr.trim() : (result.stdout ? result.stdout.trim() : `Exited with code ${result.status}`);
    throw new Error(errorMsg);
  }
  return result.stdout ? result.stdout.trim() : '';
}

// Parse command line arguments
const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch') || args.includes('-w');
const isDryRun = args.includes('--dry-run');
const noPush = args.includes('--no-push');
const intervalArg = args.find((a) => a.startsWith('--interval=') || a === '-i');
let pollInterval = 10; // seconds
if (intervalArg) {
  if (intervalArg.startsWith('--interval=')) {
    pollInterval = parseInt(intervalArg.split('=')[1], 10) || 10;
  } else {
    const idx = args.indexOf('-i');
    if (idx !== -1 && args[idx + 1]) pollInterval = parseInt(args[idx + 1], 10) || 10;
  }
}

const branchArg = args.find((a) => a.startsWith('--branch=') || a === '-b');
let targetBranchCustom = null;
if (branchArg) {
  if (branchArg.startsWith('--branch=')) {
    targetBranchCustom = branchArg.split('=')[1];
  } else {
    const idx = args.indexOf('-b');
    if (idx !== -1 && args[idx + 1]) targetBranchCustom = args[idx + 1];
  }
}

/**
 * Get current git author info or default to existing repo author
 */
function ensureGitAuthor() {
  const currentName = runGit('config user.name', { ignoreError: true });
  const currentEmail = runGit('config user.email', { ignoreError: true });

  if (!currentName || !currentEmail) {
    // Check last commit author
    const lastAuthor = runGit('log -1 --format="%an|%ae"', { ignoreError: true });
    if (lastAuthor && lastAuthor.includes('|')) {
      const [name, email] = lastAuthor.split('|');
      log('⚙️ AUTHOR', `Configuring git local author: ${name} <${email}>`, colors.yellow);
      runGit(`config user.name "${name}"`);
      runGit(`config user.email "${email}"`);
    } else {
      runGit('config user.name "Cleo Firman"');
      runGit('config user.email "cleofirman053@gmail.com"');
    }
  }
}

/**
 * Generate semantic commit message based on file path, status, and contents
 */
function generateSemanticMessage(filePath, status) {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const normalized = filePath.replace(/\\/g, '/');
  const isDeleted = status.includes('D');
  const isAdded = status.includes('?') || status.includes('A');
  const isModified = status.includes('M');

  let type = 'feat';
  let scope = 'app';
  let subject = '';

  // 1. Tests
  if (basename.includes('.test.') || basename.includes('.spec.') || normalized.includes('test/')) {
    type = 'test';
    const cleanName = basename.replace(/\.(test|spec)\.[jt]sx?$/, '');
    scope = normalized.includes('backend') ? 'backend' : 'frontend';
    subject = `add tests for ${cleanName}`;
    return `${type}(${scope}): ${subject}`;
  }

  // 2. Documentation
  if (ext === '.md' || basename.toLowerCase() === 'license') {
    type = 'docs';
    if (basename.startsWith('PRD')) scope = 'prd';
    else if (basename.startsWith('AGENTS')) scope = 'guidelines';
    else if (basename.includes('flow')) scope = 'flow';
    else if (basename.includes('task')) scope = 'tasks';
    else if (normalized.includes('backend/')) scope = 'backend';
    else if (normalized.includes('frontend/')) scope = 'frontend';
    else scope = 'docs';

    subject = isAdded ? `add ${basename}` : `update ${basename}`;
    return `${type}(${scope}): ${subject}`;
  }

  // 3. Dependencies & Configs
  if (basename === 'package.json' || basename === 'package-lock.json') {
    type = 'chore';
    scope = normalized.includes('backend') ? 'backend-deps' : 'frontend-deps';
    subject = basename === 'package-lock.json' ? 'lock dependency versions' : 'update package dependencies';
    return `${type}(${scope}): ${subject}`;
  }

  if (basename.includes('tsconfig') || basename === '.gitignore' || basename === 'Dockerfile') {
    type = 'chore';
    scope = normalized.includes('backend') ? 'backend' : 'frontend';
    if (basename === 'Dockerfile') scope = 'docker';
    subject = isAdded ? `add ${basename} configuration` : `update ${basename} configuration`;
    return `${type}(${scope}): ${subject}`;
  }

  // 4. Samples & Seed Data
  if (normalized.includes('base_knowledge/')) {
    type = 'feat';
    scope = 'knowledge';
    const cleanDoc = basename.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    subject = isAdded ? `add legal reference document ${cleanDoc}` : `update legal reference ${cleanDoc}`;
    return `${type}(${scope}): ${subject}`;
  }

  if (normalized.includes('data/samples/')) {
    type = 'chore';
    scope = 'samples';
    subject = isAdded ? `add sample dataset ${basename}` : `update sample data ${basename}`;
    return `${type}(${scope}): ${subject}`;
  }

  // 5. Backend Modules
  if (normalized.startsWith('backend/')) {
    const parts = normalized.split('/');
    if (parts.includes('routes')) {
      type = 'feat';
      const routeName = basename.replace(/\.[jt]sx?$/, '');
      scope = `routes/${routeName}`;
      subject = isAdded ? `implement ${routeName} route handler` : `update ${routeName} route handler`;
    } else if (parts.includes('services')) {
      type = 'feat';
      const serviceName = basename.replace(/\.[jt]sx?$/, '').replace(/Service$/, '');
      scope = `service/${serviceName}`;
      subject = isAdded ? `implement ${serviceName} service` : `refactor ${serviceName} service`;
    } else if (parts.includes('middleware')) {
      type = 'feat';
      const mwName = basename.replace(/\.[jt]sx?$/, '');
      scope = `middleware/${mwName}`;
      subject = isAdded ? `add ${mwName} middleware` : `update ${mwName} middleware`;
    } else if (parts.includes('config')) {
      type = 'chore';
      const cfgName = basename.replace(/\.[jt]sx?$/, '');
      scope = `config/${cfgName}`;
      subject = isAdded ? `add ${cfgName} configuration` : `update ${cfgName} config`;
    } else if (parts.includes('scripts')) {
      type = 'feat';
      const scriptName = basename.replace(/\.[jt]sx?$/, '');
      scope = `script/${scriptName}`;
      subject = isAdded ? `add ${scriptName} utility script` : `update ${scriptName} script`;
    } else if (parts.includes('workers') || parts.includes('queues')) {
      type = 'feat';
      scope = 'queue';
      const workerName = basename.replace(/\.[jt]sx?$/, '');
      subject = `implement ${workerName} processing`;
    } else if (basename === 'index.ts' || basename === 'index.js') {
      type = 'feat';
      scope = 'backend';
      subject = isAdded ? 'initialize Express server entrypoint' : 'update backend entrypoint';
    } else {
      type = isAdded ? 'feat' : 'refactor';
      scope = 'backend';
      subject = `${isAdded ? 'create' : 'update'} ${basename}`;
    }
    return `${type}(${scope}): ${subject}`;
  }

  // 6. Frontend Modules
  if (normalized.startsWith('frontend/')) {
    if (normalized.includes('/types/')) {
      type = 'refactor';
      scope = 'types';
      subject = isAdded ? `add type definitions in ${basename}` : `refine TypeScript definitions in ${basename}`;
    } else if (normalized.includes('/lib/')) {
      type = isAdded ? 'feat' : 'refactor';
      const libName = basename.replace(/\.[jt]sx?$/, '');
      scope = `lib/${libName}`;
      subject = isAdded ? `implement ${libName} utility module` : `update ${libName} utility module`;
    } else if (normalized.includes('/components/')) {
      type = 'feat';
      const compName = basename.replace(/\.[jt]sx?$/, '');
      scope = `ui/${compName}`;
      subject = isAdded ? `create ${compName} component` : `update ${compName} component`;
    } else if (normalized.includes('/app/api/') || normalized.includes('/pages/api/')) {
      type = 'feat';
      const apiPart = normalized.includes('/app/api/') ? normalized.split('/app/api/')[1] : normalized.split('/pages/api/')[1];
      const segments = apiPart.replace(/\/(route|index)\.[jt]sx?$/, '').split('/');
      const mainResource = segments[0] || 'api';
      const cleanSub = segments.slice(1).filter((s) => !s.startsWith('[')).join('/') || 'endpoint';
      scope = `api/${mainResource}`;
      subject = isAdded ? `implement ${cleanSub} API endpoint` : `update ${cleanSub} API endpoint`;
    } else if (normalized.includes('/pages/') || normalized.includes('/app/')) {
      type = 'feat';
      const pageName = basename.replace(/\.[jt]sx?$/, '');
      scope = `ui/${pageName}`;
      subject = isAdded ? `create ${pageName} page` : `update ${pageName} view`;
    } else if (normalized.includes('/scripts/')) {
      type = 'feat';
      const scriptName = basename.replace(/\.[jt]sx?$/, '');
      scope = `script/${scriptName}`;
      subject = `add ${scriptName} script`;
    } else {
      type = isAdded ? 'feat' : 'refactor';
      scope = 'frontend';
      subject = `${isAdded ? 'create' : 'update'} ${basename}`;
    }
    return `${type}(${scope}): ${subject}`;
  }

  // 7. Root scripts & files
  if (normalized.startsWith('scripts/')) {
    type = 'feat';
    scope = 'scripts';
    subject = isAdded ? `add ${basename} automation tool` : `update ${basename}`;
    return `${type}(${scope}): ${subject}`;
  }

  // Default fallback
  if (isDeleted) {
    return `chore(cleanup): remove ${basename}`;
  }
  return `${isAdded ? 'feat' : 'refactor'}(core): ${isAdded ? 'add' : 'update'} ${basename}`;
}

/**
 * Determine or create branch
 */
function setupBranch(files) {
  const currentBranch = runGit('branch --show-current');

  if (targetBranchCustom) {
    if (currentBranch !== targetBranchCustom) {
      log('🌿 BRANCH', `Switching to target branch: ${targetBranchCustom}`, colors.cyan);
      const exists = runGit(`branch --list ${targetBranchCustom}`);
      if (exists) {
        runGit(`checkout ${targetBranchCustom}`);
      } else {
        runGit(`checkout -b ${targetBranchCustom}`);
      }
    }
    return targetBranchCustom;
  }

  // If on main or staging, auto-create a dedicated feature branch
  if (currentBranch === 'main' || currentBranch === 'staging' || !currentBranch) {
    // Derive scope from changed files
    let scopeHint = 'updates';
    const hasBackend = files.some((f) => f.path.startsWith('backend/'));
    const hasFrontend = files.some((f) => f.path.startsWith('frontend/'));
    if (hasBackend && hasFrontend) scopeHint = 'fullstack-sync';
    else if (hasBackend) scopeHint = 'backend-sync';
    else if (hasFrontend) scopeHint = 'frontend-sync';

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const newBranch = `feat/${scopeHint}-${dateStr}`;

    log('🌿 BRANCH', `Currently on '${currentBranch}'. Creating dedicated feature branch: ${newBranch}`, colors.cyan);
    runGit(`checkout -b ${newBranch}`);
    return newBranch;
  }

  return currentBranch;
}

/**
 * Parse git status --porcelain
 */
function getChangedFiles() {
  const rawStatus = runGit('status --porcelain=v1 -uall', { ignoreError: true, noTrim: true });
  if (!rawStatus) return [];

  const lines = rawStatus.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const files = [];

  for (const line of lines) {
    const match = line.match(/^([A-Z?]{1,2}|\s[A-Z])\s+(.*)$/);
    let status = '';
    let filePath = '';
    if (match) {
      status = match[1].trim();
      filePath = match[2].trim();
    } else {
      status = line.slice(0, 2).trim();
      filePath = line.slice(2).trim();
    }

    // Handle renamed files "old -> new"
    if (filePath.includes(' -> ')) {
      filePath = filePath.split(' -> ')[1].trim();
    }

    // Remove quotes if filename has spaces
    if (filePath.startsWith('"') && filePath.endsWith('"')) {
      filePath = filePath.slice(1, -1);
    }

    // Skip git tracking of this script if it's currently running or temporary files
    if (!filePath || filePath === '.DS_Store' || filePath.endsWith('.DS_Store')) {
      continue;
    }

    files.push({ path: filePath, status });
  }

  return files;
}

/**
 * Process atomic commits for all detected files
 */
function runAtomicCommitAndPush() {
  ensureGitAuthor();

  const files = getChangedFiles();
  if (files.length === 0) {
    return { committedCount: 0 };
  }

  log('🔍 DETECTED', `Found ${files.length} changed/untracked file(s). Beginning atomic commit sequence...`, colors.bold);

  const activeBranch = setupBranch(files);
  let committedCount = 0;

  for (const file of files) {
    const semanticMessage = generateSemanticMessage(file.path, file.status);

    if (isDryRun) {
      log('🧪 DRY-RUN', `[${file.status}] ${file.path} -> "${semanticMessage}"`, colors.yellow);
      committedCount++;
      continue;
    }

    try {
      // Stage only this specific file
      runGitArgs(['add', file.path]);

      // Commit this specific file
      runGitArgs(['commit', '-m', semanticMessage]);

      const shortHash = runGit('rev-parse --short HEAD', { ignoreError: true }) || 'done';
      log('✅ COMMIT', `${colors.green}${shortHash}${colors.reset} - ${semanticMessage} ${colors.gray}(${file.path})${colors.reset}`);
      committedCount++;
    } catch (err) {
      log('⚠️ ERROR', `Failed to commit ${file.path}: ${err.message}`, colors.red);
    }
  }

  if (committedCount > 0 && !isDryRun && !noPush) {
    try {
      log('🚀 PUSH', `Pushing ${committedCount} atomic commit(s) to remote 'origin/${activeBranch}'...`, colors.magenta);
      runGitArgs(['push', '-u', 'origin', activeBranch]);
      log('🎉 SUCCESS', `Branch '${activeBranch}' is live on https://github.com/AnandaHariadi/Exploration-juara`, colors.green + colors.bold);
    } catch (err) {
      log('❌ PUSH ERROR', `Failed to push to origin: ${err.message}`, colors.red);
    }
  }

  return { committedCount, branch: activeBranch };
}

/**
 * Main Entry Point
 */
async function main() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🚀 CLARA - ATOMIC SEMANTIC AUTO-COMMIT & PUSH ENGINE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  if (!isWatchMode) {
    const result = runAtomicCommitAndPush();
    if (result.committedCount === 0) {
      log('✨ CLEAN', 'No uncommitted changes found. Working tree is clean.', colors.green);
    } else {
      log('🏁 FINISHED', `Completed ${result.committedCount} atomic commit(s) on branch '${result.branch}'.`, colors.bold + colors.green);
    }
    process.exit(0);
  }

  log('👀 WATCH MODE', `Watching repository for changes every ${pollInterval} second(s)... (Press Ctrl+C to stop)`, colors.yellow);

  let isProcessing = false;
  setInterval(() => {
    if (isProcessing) return;
    try {
      const files = getChangedFiles();
      if (files.length > 0) {
        isProcessing = true;
        runAtomicCommitAndPush();
        isProcessing = false;
      }
    } catch (err) {
      isProcessing = false;
      log('⚠️ WATCH ERROR', err.message, colors.red);
    }
  }, pollInterval * 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
