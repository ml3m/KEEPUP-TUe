// ============================================================
// Validation Route: Endpoint for full study plan validation
// ============================================================

import { Router } from 'express';
import { validatePlan } from '../services/validator.js';

const router = Router();

// ------------------------------------------------------------
// GET /api/validation
// Evaluates study plan against curriculum rules and returns results
// ------------------------------------------------------------
router.get('/', (_req, res) => {
  try {
    const result = validatePlan();
    res.json(result);
  } catch (error: any) {
    console.error('Error during study plan validation:', error);
    res.status(500).json({ error: 'Failed to validate plan', details: error.message });
  }
});

export default router;
