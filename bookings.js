const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
// const pool = require('../db'); // make sure the path is correct based on your project
//const db = require('../db');


const router = express.Router();
const getSeasonalRoomPrice = require('../utils/seasonalPricing');


//const { getSeasonalRoomPrice } = require('../utils/seasonalPricing');


// Middleware to verify JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
 
    if (!authHeader) {
      return res.status(403).json({ error: 'No token provided' });
    }
 
    const token = authHeader.split(' ')[1]; // 💥 Extract just the token part
 
    if (!token) {
      return res.status(403).json({ error: 'Token format invalid' });
    }
 
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: 'Invalid token' });
 
      req.user = decoded;
      next();
    });
}


// View all available rooms
router.get('/rooms', (req, res) => {
  db.query('SELECT * FROM rooms WHERE is_available = 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch rooms' });
    res.json(results);
  });
});


// POST /api/bookings/book-room
// POST /api/bookings/book-room
router.post('/book-room', verifyToken, (req, res) => {
  console.log('Booking request received:', req.body);
  const { room_id, check_in, check_out, guest_services } = req.body;
  const user_id = req.user.id;


  if (!room_id || !check_in || !check_out) {
    return res.status(400).json({ message: 'Missing required booking fields' });
  }


  // Step 1: Get base room price from DB
  const roomQuery = 'SELECT base_price FROM rooms WHERE id = ?';
  db.query(roomQuery, [room_id], (err, roomResult) => {
    if (err || roomResult.length === 0) {
      return res.status(500).json({ message: 'Room price lookup failed', err });
    }


    //const basePrice = roomResult[0].price;
    const basePrice = roomResult[0].base_price;
    const seasonalPrice = getSeasonalRoomPrice(basePrice, check_in);


    // Step 2: Calculate number of nights
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const roomCost = seasonalPrice * nights;


    // Step 3: Add up guest service costs
    let serviceCost = 0;
    if (guest_services && guest_services.length > 0) {
      serviceCost = guest_services.reduce((sum, s) => sum + s.cost, 0);
    }


    const total_price = roomCost + serviceCost;


    db.beginTransaction(err => {
      if (err) return res.status(500).json({ message: 'Transaction error', err });


      const bookingQuery = `
        INSERT INTO bookings (user_id, room_id, check_in, check_out, total_price)
        VALUES (?, ?, ?, ?, ?)
      `;


      db.query(bookingQuery, [user_id, room_id, check_in, check_out, total_price], (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Booking insert failed', err });
          });
        }


        const bookingId = result.insertId;
        const points = Math.floor(total_price / 50) * 25;


        const addGuestServices = (callback) => {
          if (guest_services && guest_services.length > 0) {
            const serviceValues = guest_services.map(service => [
              bookingId,
              service.service_name,
              service.cost
            ]);


            const serviceQuery = `
              INSERT INTO guest_services (booking_id, service_name, cost)
              VALUES ?
            `;


            db.query(serviceQuery, [serviceValues], (err) => {
              if (err) return db.rollback(() => res.status(500).json({ message: 'Guest services insert failed', err }));
              callback();
            });
          } else {
            callback();
          }
        };


        addGuestServices(() => {
          if (points > 0) {
            db.query(
              'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
              [points, user_id],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ message: 'Failed to update loyalty points', err });
                  });
                }


                db.commit(err => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ message: 'Commit failed', err });
                    });
                  }


                  res.status(201).json({
                    message: 'Room booked successfully and loyalty points awarded!',
                    bookingId,
                    total_price,
                    pointsEarned: points
                  });
                });
              }
            );
          } else {
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Commit failed', err });
                });
              }


              res.status(201).json({
                message: 'Room booked successfully',
                bookingId,
                total_price,
                pointsEarned: 0
              });
            });
          }
        });
      });
    });
  });
});






// View user's bookings
router.get('/my-bookings', verifyToken, (req, res) => {
  const user_id = req.user.id;
  const sql = `
    SELECT b.id, r.room_number, b.check_in, b.check_out, b.status
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.user_id = ?
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch bookings' });
    res.json(results);
  });
});


// Cancel a booking
router.delete('/cancel/:id', verifyToken, (req, res) => {
  const booking_id = req.params.id;
  const user_id = req.user.id;


  // First, get the room_id from the booking
  db.query('SELECT room_id FROM bookings WHERE id = ? AND user_id = ?', [booking_id, user_id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Booking not found' });


    const room_id = results[0].room_id;


    // Delete booking
    db.query('DELETE FROM bookings WHERE id = ?', [booking_id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to cancel booking' });


      // Mark room as available again
      db.query('UPDATE rooms SET is_available = 1 WHERE id = ?', [room_id]);
      res.json({ message: 'Booking cancelled and room is now available' });
    });
  });
});






// Testing token separately
router.get('/test-token', verifyToken, (req, res) => {
    res.json({ message: 'Token is valid!', user: req.user });
});


module.exports = router;