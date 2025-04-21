const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Add a guest service request
// Add a guest service request
router.post('/add', verifyToken, (req, res) => {
    const { booking_id, service_name, cost } = req.body;
  
    if (!booking_id || !service_name || !cost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const sql = `
      INSERT INTO guest_services (booking_id, service_name, cost)
      VALUES (?, ?, ?)
    `;
  
    db.query(sql, [booking_id, service_name, cost], (err, result) => {
      if (err) {
        console.error('MySQL Error:', err);
        return res.status(500).json({ error: 'Failed to add service request', details: err.message });
      }
  
      res.status(201).json({ message: 'Guest service request added successfully' });
    });
});

// Get total guest service charges for a booking
router.get('/total/:booking_id', verifyToken, (req, res) => {
    const booking_id = req.params.booking_id;
  
    const sql = `SELECT SUM(cost) AS total_charges FROM guest_services WHERE booking_id = ?`;
    db.query(sql, [booking_id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to calculate total charges' });
      }
      res.json({ booking_id, total_charges: results[0].total_charges || 0 });
    });
});


// Get all guest services for a specific booking
router.get('/:booking_id', verifyToken, (req, res) => {
  const booking_id = req.params.booking_id;
  const user_id = req.user.id;
  const isAdmin = req.user.is_admin;

  if (isAdmin === 1) {
    // Admins can view any booking
    const sql = 'SELECT * FROM guest_services WHERE booking_id = ?';
    db.query(sql, [booking_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch service requests' });
      res.json(results);
    });
  } else {
    // Regular users can only view their own booking’s services
    const bookingSql = 'SELECT * FROM bookings WHERE id = ? AND user_id = ?';
    db.query(bookingSql, [booking_id, user_id], (err, bookings) => {
      if (err) return res.status(500).json({ error: 'Failed to verify booking ownership' });

      if (bookings.length === 0) {
        return res.status(403).json({ error: 'Access denied. This booking is not yours.' });
      }

      // Fetch services for this booking
      const serviceSql = 'SELECT * FROM guest_services WHERE booking_id = ?';
      db.query(serviceSql, [booking_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch service requests' });
        res.json(results);
      });
    });
  }
});

// calculate total charges per guest/booking
router.get('/charges/:booking_id', verifyToken, (req, res) => {
    const booking_id = req.params.booking_id;
    const user_id = req.user.id;
    const isAdmin = req.user.is_admin;
  
    const verifySql = isAdmin
      ? 'SELECT * FROM bookings WHERE id = ?'
      : 'SELECT * FROM bookings WHERE id = ? AND user_id = ?';
  
    const params = isAdmin ? [booking_id] : [booking_id, user_id];
  
    db.query(verifySql, params, (err, bookings) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (bookings.length === 0)
        return res.status(403).json({ error: 'Access denied or booking not found' });
  
      // Now fetch total charges
      const totalSql = `
        SELECT 
          b.id AS booking_id,
          b.user_id,
          b.total_price AS room_total,
          IFNULL(SUM(gs.cost), 0) AS service_total,
          (b.total_price + IFNULL(SUM(gs.cost), 0)) AS total_charges
        FROM bookings b
        LEFT JOIN guest_services gs ON b.id = gs.booking_id
        WHERE b.id = ?
        GROUP BY b.id
      `;
  
      db.query(totalSql, [booking_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to calculate charges' });
        res.json(results[0]); // Return single result
      });
    });
});
  
  

module.exports = router;
