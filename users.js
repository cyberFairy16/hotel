const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// Get logged-in user's profile info
router.get('/profile', verifyToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, username, name, email, phone, id_number, address, loyalty_points
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Failed to fetch user profile:', err);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(results[0]);
  });
});

module.exports = router;
