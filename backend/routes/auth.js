const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const router = express.Router();

// تسجيل الدخول
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND status = "active"', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
});

// تسجيل خروج (اختياري)
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

module.exports = router;