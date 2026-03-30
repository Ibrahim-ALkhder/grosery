const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const lowStock = rows.filter(p => p.stock <= p.min_stock);
    res.json({ products: rows, lowStock });
  });
});

router.post('/restock', (req, res) => {
  const { productId, quantity } = req.body;
  db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;