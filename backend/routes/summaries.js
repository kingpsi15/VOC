const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust if your db file is elsewhere

// GET /api/summaries
router.get('/summaries', async (req, res) => {
  const { service, summary_type, scope, location } = req.query;

  try {
    const loc = scope === 'per_location' ? location : 'All';

    const [rows] = await db.execute(`
      SELECT summary_text FROM summaries
      WHERE service_type = ? AND summary_type = ? AND location = ?
      ORDER BY generated_on DESC LIMIT 1
    `, [service, summary_type, loc]);

    return res.json({ data: rows });
  } catch (err) {
    console.error('❌ Failed to fetch summary:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;