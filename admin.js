const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth'); // Import the verifyToken middleware
const checkAdmin = require('../middleware/checkadmin'); // newly created

const router = express.Router();

// Admin middleware to verify if the user is an admin
router.use(verifyToken); // Protect all admin routes with token verification

// View all users (Only accessible by admin)
router.get('/users', (req, res) => {
  // Check if the user is an admin
  if (req.user.is_admin !== 1) {
    return res.status(403).json({ error: 'Access denied, admin only' });
  }

  // Query to fetch all users from the users table (excluding sensitive data like password)
  const sql = 'SELECT id, username, email, name, phone, id_number, address, loyalty_points, created_at FROM users';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(results); // Return the list of users to the admin
  });
});

// Other admin functionalities like updating or deleting users can be added here

// Add a new room
router.post('/admin/add-room', verifyToken, (req, res) => {
    const { room_number, type, base_price, is_available } = req.body;
  
    // Ensure the user is an admin
    if (req.user.is_admin !== 1) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  
    // Insert the new room into the database
    const sql = 'INSERT INTO rooms (room_number, type, base_price, is_available) VALUES (?, ?, ?, ?)';
    db.query(sql, [room_number, type, base_price, is_available], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to add room' });
  
      res.status(201).json({ message: 'Room added successfully' });
    });
});

// Remove an existing room by room number
router.delete('/admin/rooms/:room_number', verifyToken, (req, res) => {
    const room_number = req.params.room_number;
    
    // Ensure the user is an admin
    if (req.user.is_admin !== 1) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Check if the room is available (not booked) before deleting it
    const checkSql = 'SELECT * FROM bookings WHERE room_id IN (SELECT id FROM rooms WHERE room_number = ?)';
    db.query(checkSql, [room_number], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error checking room bookings' });
  
      if (results.length > 0) {
        return res.status(400).json({ error: 'Room is currently booked and cannot be deleted' });
      }
  
      // Delete the room by room number
      const sql = 'DELETE FROM rooms WHERE room_number = ?';
      db.query(sql, [room_number], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to delete room' });
  
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Room not found' });
        }
  
        res.json({ message: 'Room deleted successfully' });
      });
    });
});

// Update service request status (admin only)
router.put('/guest-services/:id/status', (req, res) => {
  const user = req.user;

  if (user.is_admin !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const serviceId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = 'UPDATE guest_services SET status = ? WHERE id = ?';

  db.query(sql, [status, serviceId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update service status' });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({ message: 'Service status updated successfully' });
  });
});

// Revenue report route
router.get('/admin/revenue', verifyToken, checkAdmin, (req, res) => {
  const bookingRevenueQuery = 'SELECT SUM(total_price) AS total_booking FROM bookings';
  const serviceRevenueQuery = 'SELECT SUM(cost) AS total_services FROM guest_services';

  db.query(bookingRevenueQuery, (err1, result1) => {
    if (err1) return res.status(500).json({ error: 'Failed to calculate booking revenue' });

    db.query(serviceRevenueQuery, (err2, result2) => {
      if (err2) return res.status(500).json({ error: 'Failed to calculate service revenue' });

      const bookingRevenue = parseFloat(result1[0].total_booking) || 0;
      const serviceRevenue = parseFloat(result2[0].total_services) || 0;
      const total = bookingRevenue + serviceRevenue;

      res.json({
        booking: bookingRevenue,
        services: serviceRevenue,
        total
      });
    });
  });
});
  

// Get bookings for a specific user (admin only)
router.get('/admin/user-bookings', verifyToken, checkAdmin, (req, res) => {
  const { usernameOrEmail } = req.query;

  const userQuery = `
    SELECT id FROM users
    WHERE username = ? OR email = ?
  `;

  db.query(userQuery, [usernameOrEmail, usernameOrEmail], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult[0].id;

    const bookingQuery = `
      SELECT b.id AS booking_id, r.type, r.room_number, b.check_in, b.check_out, b.total_price
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.user_id = ?
    `;

    db.query(bookingQuery, [userId], (err, bookings) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch bookings' });

      if (bookings.length === 0) {
        return res.json({ bookings: [] });
      }

      const bookingIds = bookings.map(b => b.booking_id);
      const placeholders = bookingIds.map(() => '?').join(',');

      const serviceQuery = `
        SELECT booking_id, service_name, cost
        FROM guest_services
        WHERE booking_id IN (${placeholders})
      `;

      db.query(serviceQuery, bookingIds, (err, services) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch guest services' });

        const bookingMap = {};
        bookings.forEach(b => {
          bookingMap[b.booking_id] = { ...b, services: [] };
        });

        services.forEach(s => {
          bookingMap[s.booking_id].services.push({ name: s.service_name, cost: s.cost });
        });

        const finalResults = Object.values(bookingMap);
        res.json({ bookings: finalResults });
      });
    });
  });
});


// Get detailed info about a user (admin only)
router.get('/admin/user-info', verifyToken, checkAdmin, (req, res) => {
  const { usernameOrEmail } = req.query;

  if (!usernameOrEmail) {
    return res.status(400).json({ error: 'Username or email is required' });
  }

  const sql = `
    SELECT id, username, email, name, phone, id_number, address, loyalty_points, created_at
    FROM users
    WHERE username = ? OR email = ?
  `;

  db.query(sql, [usernameOrEmail, usernameOrEmail], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch user information' });

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: results[0] });
  });
});

// Check room availability by room number (admin only)
router.get('/admin/check-room-availability', verifyToken, checkAdmin, (req, res) => {
  const { room_number } = req.query;

  if (!room_number) {
    return res.status(400).json({ error: 'Room number is required' });
  }

  // Step 1: Check if room exists
  const roomQuery = 'SELECT id, type, is_available FROM rooms WHERE room_number = ?';

  db.query(roomQuery, [room_number], (err, roomResults) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (roomResults.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResults[0];

    // Step 2: Check if room is booked currently (i.e., overlapping with today's date)
    const checkBooking = `
      SELECT * FROM bookings 
      WHERE room_id = ? AND CURDATE() BETWEEN check_in AND check_out
    `;

    db.query(checkBooking, [room.id], (err, bookings) => {
      if (err) return res.status(500).json({ error: 'Failed to check bookings' });

      const isCurrentlyBooked = bookings.length > 0;

      res.json({
        room_number,
        type: room.type,
        is_available: room.is_available === 1,
        currently_booked: isCurrentlyBooked
      });
    });
  });
});


// Get booking details with user and room info (admin only)
router.get('/admin/booking-details/:bookingId', verifyToken, checkAdmin, (req, res) => {
  const bookingId = req.params.bookingId;

  const query = `
    SELECT 
      b.id AS booking_id,
      b.check_in,
      b.check_out,
      b.total_price,
      b.status AS booking_status,
      u.id AS user_id,
      u.name AS customer_name,
      u.email,
      u.phone,
      r.room_number,
      r.type AS room_type,
      r.base_price,
      r.is_available
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `;

  db.query(query, [bookingId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while fetching booking details' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: results[0] });
  });
});

// Route to calculate total revenue from completed guest services
router.get('/admin/total-revenue', async (req, res) => {
  try {
    const query = 'SELECT SUM(cost) AS total_revenue FROM guest_services WHERE status = "Completed"';
    const [result] = await pool.query(query);
    const totalRevenue = result[0].total_revenue || 0; // If no completed services, set revenue to 0

    res.status(200).json({ total_revenue: totalRevenue });
  } catch (err) {
    console.error('Error calculating total revenue:', err);
    res.status(500).json({ error: 'An error occurred while calculating total revenue' });
  }
});

module.exports = router;
  

module.exports = router;
