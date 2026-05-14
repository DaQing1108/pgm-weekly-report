'use strict';

const fs   = require('fs');
const path = require('path');

const WEEKS_DIR = path.join(__dirname, '../data/weeks');

// ── Shared snapshot helper (mirrors index.js logic) ───────────────────────
function _summary(weekLabel, data) {
  const snap = (data.snapshots || []).find(s => s.weekLabel === weekLabel)
             || (data.snapshots || []).slice(-1)[0] || {};
  return {
    weekLabel,
    weekStart:    snap.weekStart   || data.weekStart || '',
    projectCount: (data.projects   || []).length,
    onTrackPct:   snap.onTrackPct  || 0,
    atRiskCount:  snap.atRiskCount || 0,
    savedAt:      data._savedAt    || ''
  };
}

// ── Filesystem implementation (local dev / no DATABASE_URL) ───────────────
const fsImpl = {
  async initDB() {},

  async listWeeks() {
    if (!fs.existsSync(WEEKS_DIR)) return [];
    const files = fs.readdirSync(WEEKS_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const weekLabel = f.replace('.json', '');
      try {
        const data = JSON.parse(fs.readFileSync(path.join(WEEKS_DIR, f), 'utf8'));
        return _summary(weekLabel, data);
      } catch {
        return { weekLabel, weekStart: '', projectCount: 0, onTrackPct: 0, atRiskCount: 0, savedAt: '' };
      }
    }).sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
  },

  async getWeek(weekLabel) {
    const file = path.join(WEEKS_DIR, `${weekLabel}.json`);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  },

  async saveWeek(weekLabel, body) {
    const payload = { ...body, _savedAt: new Date().toISOString() };
    fs.writeFileSync(
      path.join(WEEKS_DIR, `${weekLabel}.json`),
      JSON.stringify(payload, null, 2),
      'utf8'
    );
    return { weekLabel };
  }
};

// ── PostgreSQL implementation ─────────────────────────────────────────────
function buildPgImpl() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
      ? { rejectUnauthorized: false }
      : false
  });

  async function initDB() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weeks (
        week_label TEXT        PRIMARY KEY,
        data       JSONB       NOT NULL,
        saved_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Auto-seed from JSON files if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) AS cnt FROM weeks');
    if (parseInt(rows[0].cnt, 10) > 0) return;

    if (!fs.existsSync(WEEKS_DIR)) return;
    const files = fs.readdirSync(WEEKS_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) return;

    console.log(`[db] Seeding ${files.length} week(s) from JSON files…`);
    for (const f of files) {
      try {
        const weekLabel = f.replace('.json', '');
        const data      = JSON.parse(fs.readFileSync(path.join(WEEKS_DIR, f), 'utf8'));
        const savedAt   = data._savedAt || null;
        await pool.query(
          `INSERT INTO weeks (week_label, data, saved_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (week_label) DO NOTHING`,
          [weekLabel, JSON.stringify(data), savedAt]
        );
      } catch (err) {
        console.warn(`[db] Seed skipped ${f}:`, err.message);
      }
    }
    console.log('[db] Seed complete.');
  }

  async function listWeeks() {
    const { rows } = await pool.query(
      `SELECT week_label, data, saved_at FROM weeks ORDER BY week_label DESC`
    );
    return rows.map(r => {
      // pg auto-parses JSONB → plain object; data is already an object
      return {
        ..._summary(r.week_label, r.data),
        savedAt: r.saved_at ? new Date(r.saved_at).toISOString() : (r.data._savedAt || '')
      };
    });
  }

  async function getWeek(weekLabel) {
    const { rows } = await pool.query(
      'SELECT data FROM weeks WHERE week_label = $1',
      [weekLabel]
    );
    return rows.length ? rows[0].data : null;
  }

  async function saveWeek(weekLabel, body) {
    const now     = new Date().toISOString();
    const payload = { ...body, _savedAt: now };
    await pool.query(
      `INSERT INTO weeks (week_label, data, saved_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (week_label)
       DO UPDATE SET data = EXCLUDED.data, saved_at = EXCLUDED.saved_at`,
      [weekLabel, JSON.stringify(payload), now]
    );
    return { weekLabel };
  }

  return { initDB, listWeeks, getWeek, saveWeek };
}

module.exports = process.env.DATABASE_URL ? buildPgImpl() : fsImpl;
