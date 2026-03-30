const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const username = 'admin1';
const newPassword = '1234';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(newPassword, salt);

db.run(
  `UPDATE users SET password = ?, status = 'active' WHERE username = ?`,
  [hash, username],
  function(err) {
    if (err) {
      console.error('Error updating admin:', err);
    } else {
      if (this.changes > 0) {
        console.log(`✅ Admin account '${username}' has been reset to password '${newPassword}' and activated.`);
      } else {
        console.log(`❌ Admin account '${username}' not found.`);
      }
    }
    db.close();
  }
);