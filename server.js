// File: server.js
const express = require('express');
const cors = require('cors');
//const mysql = require('mysql2');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin'); // Import admin route
const guestServicesRoute = require('./routes/guestServices');
const userRoutes = require('./routes/users');

const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
// Use the admin route for all routes starting with /api/admin
app.use('/api', adminRoutes);
//app.use('/api/admin', adminRoutes);
app.use('/api/guest-services', guestServicesRoute);
app.use('/api/users', userRoutes);

// MySQL Connection
//const db = mysql.createConnection({
  //host: process.env.DB_HOST,
  //user: process.env.DB_USER,
  //password: process.env.DB_PASSWORD,
  //database: process.env.DB_NAME
//});

//db.connect(err => {
  //if (err) throw err;
  //console.log('MySQL Connected...');
//});

app.listen(5000, () => {
  console.log('Server started on port 5000');
});

// module.exports = db;
