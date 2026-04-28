/**
 * health-check.js
 * Runs HTTP endpoint checks + static code analysis on the PgM Weekly Report system.
 * Outputs a JSON report to stdout.
 *
 * Usage: node health-check.js > health-report.json
 * Env:   RAILWAY_APP_URL (default: production URL)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASE_URL = (process.env.RAILWAY_APP_URL || 'https://pgm-weekly-report-production.up.railway.app').replace(/\/$/, '');

const issues = [];
const passed = [];

// ── Helpers ────────────────────────────────────────────────────

function fail(check, detail) {
  issues.push({ check, detail, severity: 'error' });
}

function warn(check, detail) {
  issues.push({ check, detail, severity: 'warning' });
}

function ok(check) {
  passed.push({ check });
}

async function fetchJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchStatus(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  return res.status;
}

function readSource(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

// ── HTTP Checks ────────────────────────────────────────────────

async function checkApiHealth() {
  try {
    const data = await fetchJSON(`${BASE_URL}/api/health`);
    if (data.status === 'ok') {
      ok('API /api/health');
    } else {
      fail('API /api/health', `Unexpected status: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('API /api/health', e.message);
  }
}

async function checkApiReports() {
  try {
    const data = await fetchJSON(`${BASE_URL}/api/reports`);
    if (!Array.isArray(data.reports)) {
      fail('API /api/reports', `Expected { reports: [] }, got: ${JSON.stringify(data).slice(0, 100)}`);
      return;
    }
    ok('API /api/reports');
    if (data.reports.length === 0) {
      warn('API /api/reports', 'No reports found — backend/reports/ may be empty');
    }
    // Check each report has required fields
    const missing = data.reports.filter(r => !r.filename || !r.size);
    if (missing.length > 0) {
      warn('API /api/reports shape', `${missing.length} report(s) missing filename or size`);
    }
  } catch (e) {
    fail('API /api/reports', e.message);
  }
}

async function checkApiWeeks() {
  try {
    const data = await fetchJSON(`${BASE_URL}/api/weeks`);
    if (!Array.isArray(data)) {
      fail('API /api/weeks', `Expected array, got: ${typeof data}`);
      return;
    }
    ok('API /api/weeks');
    if (data.length === 0) {
      warn('API /api/weeks', 'No week snapshots found');
    }
  } catch (e) {
    fail('API /api/weeks', e.message);
  }
}

async function checkReadRoute() {
  try {
    const res = await fetch(`${BASE_URL}/read`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      fail('Route /read', `HTTP ${res.status}`);
      return;
    }
    const html = await res.text();
    if (!html.includes('PgM') && !html.includes('週報')) {
      warn('Route /read', 'Response HTML missing expected PgM/週報 content');
    } else {
      ok('Route /read');
    }
  } catch (e) {
    fail('Route /read', e.message);
  }
}

async function checkHtmlPages() {
  const pages = [
    '/',
    '/input.html',
    '/risks.html',
    '/actions.html',
    '/milestones.html',
    '/report.html',
    '/trends.html',
    '/review.html',
    '/resources.html',
  ];

  await Promise.all(pages.map(async (page) => {
    try {
      const status = await fetchStatus(`${BASE_URL}${page}`);
      if (status === 200) {
        ok(`Page ${page}`);
      } else {
        fail(`Page ${page}`, `HTTP ${status}`);
      }
    } catch (e) {
      fail(`Page ${page}`, e.message);
    }
  }));
}

// ── Static Code Analysis ────────────────────────────────────────

/**
 * Check all HTML pages have the 3-listener cross-page sync pattern.
 * Required by CLAUDE.md: pageshow (bfcache) + storage (cross-tab) + store:updated
 */
function checkSyncListeners() {
  const htmlFiles = [
    'program-sync/index.html',
    'program-sync/input.html',
    'program-sync/risks.html',
    'program-sync/actions.html',
    'program-sync/milestones.html',
    'program-sync/trends.html',
    'program-sync/review.html',
    // report.html is excluded — uses _isDirty guard instead
  ];

  for (const file of htmlFiles) {
    try {
      const src = readSource(file);
      const missing = [];
      if (!src.includes("addEventListener('pageshow'") && !src.includes('addEventListener("pageshow"')) {
        missing.push('pageshow');
      }
      if (!src.includes("addEventListener('storage'") && !src.includes('addEventListener("storage"')) {
        missing.push('storage');
      }
      if (!src.includes("addEventListener('store:updated'") && !src.includes('addEventListener("store:updated"')) {
        missing.push('store:updated');
      }
      if (missing.length > 0) {
        warn(
          `Sync listeners: ${file}`,
          `Missing cross-page sync listeners: ${missing.join(', ')} — see CLAUDE.md §跨頁同步三件套`,
        );
      } else {
        ok(`Sync listeners: ${file}`);
      }
    } catch (e) {
      warn(`Sync listeners: ${file}`, `Could not read file: ${e.message}`);
    }
  }
}

/**
 * Check STATUS_OPTIONS values in schema.js match what store.js stats() queries.
 * schema.js defines: 'on-track' | 'at-risk' | 'behind' | 'paused'
 * store.js must query those exact strings.
 */
function checkStatusConsistency() {
  try {
    const schema = readSource('program-sync/assets/data/schema.js');
    const store  = readSource('program-sync/assets/js/store.js');

    const statusValues = ['on-track', 'at-risk', 'behind', 'paused'];
    const missing = statusValues.filter(v => !store.includes(`'${v}'`) && !store.includes(`"${v}"`));

    if (missing.length > 0) {
      fail(
        'Status value consistency',
        `store.js stats() is missing queries for status values: ${missing.join(', ')} — must match schema.js STATUS_OPTIONS`,
      );
    } else {
      ok('Status value consistency');
    }

    // Also check ACTION_STATUSES: 'pending'|'in-progress'|'done'|'blocked'
    const actionStatuses = ['pending', 'in-progress', 'done', 'blocked'];
    const missingAction = actionStatuses.filter(v =>
      !store.includes(`'${v}'`) && !store.includes(`"${v}"`),
    );
    if (missingAction.length > 0) {
      warn(
        'Action status consistency',
        `store.js missing action status values: ${missingAction.join(', ')}`,
      );
    } else {
      ok('Action status consistency');
    }
  } catch (e) {
    warn('Status consistency check', `Could not run: ${e.message}`);
  }
}

/**
 * Check importAll REQUIRED_FIELDS match actual data model keys from CLAUDE.md.
 */
function checkImportAllSchema() {
  try {
    const store = readSource('program-sync/assets/js/store.js');

    const expectedFields = {
      projects:   ['id', 'name'],
      risks:      ['id', 'description'],
      actions:    ['id', 'task'],
      milestones: ['id', 'name'],
      snapshots:  ['id', 'weekStart'],
      drafts:     ['id', 'weekStart'],
      members:    ['id', 'name'],
    };

    for (const [entity, fields] of Object.entries(expectedFields)) {
      const missing = fields.filter(f => {
        // Check the field appears near the entity in REQUIRED_FIELDS block
        const pattern = new RegExp(`${entity}[^}]*?['"]${f}['"]`, 's');
        return !pattern.test(store);
      });
      if (missing.length > 0) {
        warn(
          `importAll schema: ${entity}`,
          `REQUIRED_FIELDS for '${entity}' may be missing: ${missing.join(', ')}`,
        );
      }
    }
    ok('importAll REQUIRED_FIELDS');
  } catch (e) {
    warn('importAll schema check', `Could not run: ${e.message}`);
  }
}

/**
 * Check backend reports directory has at least one recent .md file.
 */
function checkReportFiles() {
  try {
    const reportsDir = path.join(REPO_ROOT, 'backend/reports');
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      warn('Backend reports', 'backend/reports/ has no .md files');
    } else {
      ok(`Backend reports (${files.length} files)`);
    }
  } catch (e) {
    warn('Backend reports', `Could not read backend/reports/: ${e.message}`);
  }
}

/**
 * Check week data files in backend/data/weeks/ are valid JSON.
 */
function checkWeekDataFiles() {
  try {
    const weeksDir = path.join(REPO_ROOT, 'backend/data/weeks');
    const files = fs.readdirSync(weeksDir).filter(f => f.endsWith('.json'));
    let corrupt = 0;
    for (const f of files) {
      try {
        JSON.parse(fs.readFileSync(path.join(weeksDir, f), 'utf-8'));
      } catch {
        corrupt++;
        fail(`Week data: ${f}`, 'Invalid JSON — file may be corrupt');
      }
    }
    if (corrupt === 0) {
      ok(`Week data files (${files.length} files valid)`);
    }
  } catch (e) {
    warn('Week data files', `Could not read backend/data/weeks/: ${e.message}`);
  }
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  const startedAt = new Date().toISOString();

  await Promise.all([
    checkApiHealth(),
    checkApiReports(),
    checkApiWeeks(),
    checkReadRoute(),
    checkHtmlPages(),
  ]);

  checkSyncListeners();
  checkStatusConsistency();
  checkImportAllSchema();
  checkReportFiles();
  checkWeekDataFiles();

  const report = {
    generatedAt: startedAt,
    baseUrl: BASE_URL,
    summary: {
      total: issues.length + passed.length,
      passed: passed.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
    },
    issues,
    passed,
  };

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');

  // Exit 1 if any errors (not warnings) — lets CI detect critical failures
  const hasErrors = issues.some(i => i.severity === 'error');
  process.exit(hasErrors ? 1 : 0);
}

main().catch(e => {
  process.stderr.write(`[health-check] Fatal: ${e.message}\n`);
  process.exit(2);
});
