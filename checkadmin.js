// middleware/checkAdmin.js
const db = require('../db'); // or wherever you initialize your DB connection

const checkAdmin = (req, res, next) => {
  const userId = req.user.id; // comes from verifyToken

  const query = 'SELECT is_admin FROM users WHERE id = ?';
  db.query(query, [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or user not found' });
    }

    if (result[0].is_admin !== 1) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    next();
  });
};

module.exports = checkAdmin;
