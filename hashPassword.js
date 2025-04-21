const bcrypt = require('bcrypt');
const db = require('./db'); // Or adjust this path to where your DB connection is

const password = 'admin123'; // The password you want to hash
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) throw err;

  // Now, update the hashed password in the database for the admin user
  const sql = 'UPDATE users SET password = ? WHERE username = ?';
  db.query(sql, [hash, 'adminUser'], (err, result) => {
    if (err) {
      console.log('Error updating password:', err);
      return;
    }
    console.log('Password updated successfully');
  });
});
