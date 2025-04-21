// File: routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register Route
router.post('/register', (req, res) => {
    const { username, email, password, name, phone, id_number, address } = req.body;
  
    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
  
    const sql = `
      INSERT INTO users (username, email, password, name, phone, id_number, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [username, email, hashedPassword, name, phone, id_number, address];
    //altered
    // db.query(sql, values, (err, result) => {
      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("Registration error:", err);  // This helps you see the exact issue
          return res.status(500).json({ error: "Registration failed" });
        }
        res.status(201).json({ message: "User registered successfully" });
      });
});
  
// Login Route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  });
});

module.exports = router;