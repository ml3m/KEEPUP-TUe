// ============================================================
// Database connection and initialization
// Uses better-sqlite3 for synchronous, fast SQLite access
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'keepup.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initializeSchema(db);
    seedIfEmpty(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 5,
      focus_area TEXT CHECK(focus_area IN ('algo_theory', 'arch_systems', 'soft_analytics') OR focus_area IS NULL),
      course_type TEXT CHECK(course_type IN ('foundational', 'deepening', 'cse_elective', 'seminar', 'graduation') OR course_type IS NULL),
      quarter TEXT DEFAULT '1',
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      specialization_area TEXT CHECK(specialization_area IN ('algo_theory', 'arch_systems', 'soft_analytics') OR specialization_area IS NULL),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plan_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK(category IN ('foundational', 'specialization', 'cse_elective', 'free_elective', 'seminar', 'graduation')),
      year INTEGER CHECK(year IN (1, 2) OR year IS NULL),
      quarter INTEGER CHECK(quarter IN (1, 2, 3, 4) OR quarter IS NULL),
      status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'passed', 'failed')),
      grade REAL CHECK(grade IS NULL OR (grade >= 0 AND grade <= 10)),
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id)
    );
  `);
}

function seedIfEmpty(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
  if (count.count === 0) {
    seedDatabase(db);
    console.log('✅ Database seeded with curriculum data');
  }

  // Ensure user_settings row exists
  const settings = db.prepare('SELECT COUNT(*) as count FROM user_settings').get() as { count: number };
  if (settings.count === 0) {
    db.prepare('INSERT INTO user_settings (id, specialization_area) VALUES (1, NULL)').run();
  }
}
