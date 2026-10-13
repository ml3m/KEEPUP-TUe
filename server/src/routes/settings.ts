// ============================================================
// Settings Routes: User settings management
// ============================================================

import { Router } from 'express';
import { getDb } from '../db/index.js';
import type { FocusArea, UserSettings } from '../types.js';

const router = Router();

const VALID_FOCUS_AREAS: FocusArea[] = ['algo_theory', 'arch_systems', 'soft_analytics'];

// ------------------------------------------------------------
// GET /api/settings
// Get current user settings (row id = 1)
// ------------------------------------------------------------
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    let settings = db.prepare('SELECT * FROM user_settings WHERE id = 1').get() as UserSettings | undefined;

    if (!settings) {
      db.prepare('INSERT INTO user_settings (id, specialization_area) VALUES (1, NULL)').run();
      settings = db.prepare('SELECT * FROM user_settings WHERE id = 1').get() as UserSettings;
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

// ------------------------------------------------------------
// PUT /api/settings
// Update user settings: body { specialization_area }
// ------------------------------------------------------------
router.put('/', (req, res) => {
  try {
    const db = getDb();
    const { specialization_area } = req.body;

    let parsedArea: FocusArea | null = null;
    if (specialization_area !== undefined && specialization_area !== null && specialization_area !== '') {
      if (!VALID_FOCUS_AREAS.includes(specialization_area)) {
        return res.status(400).json({
          error: `Invalid specialization_area. Allowed values: ${VALID_FOCUS_AREAS.join(', ')} or null`,
        });
      }
      parsedArea = specialization_area;
    }

    // Ensure row exists
    const existing = db.prepare('SELECT id FROM user_settings WHERE id = 1').get();
    if (!existing) {
      db.prepare('INSERT INTO user_settings (id, specialization_area) VALUES (1, ?)').run(parsedArea);
    } else {
      db.prepare(`
        UPDATE user_settings
        SET specialization_area = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(parsedArea);
    }

    const updated = db.prepare('SELECT * FROM user_settings WHERE id = 1').get() as UserSettings;
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

export default router;
