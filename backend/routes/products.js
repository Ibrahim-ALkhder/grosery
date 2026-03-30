const express = require('express');
const db = require('../database');

module.exports = (upload) => {
  const router = express.Router();

  // جلب جميع المنتجات مع بحث
  router.get('/', (req, res) => {
    const { search } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    if (search) {
      query += ' WHERE name LIKE ? OR barcode LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }
    db.all(query, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // جلب منتج بالباركود
  router.get('/barcode/:barcode', (req, res) => {
    const { barcode } = req.params;
    db.get('SELECT * FROM products WHERE barcode = ?', [barcode], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Product not found' });
      res.json(row);
    });
  });

  // إضافة منتج مع صورة
  router.post('/', upload.single('image'), (req, res) => {
    const { name, barcode, category, selling_price, cost_price, stock, min_stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(
      `INSERT INTO products (name, barcode, category, selling_price, cost_price, stock, min_stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, barcode, category, selling_price, cost_price, stock, min_stock, image_url],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, image_url, success: true });
      }
    );
  });

  // تعديل منتج مع صورة جديدة اختيارية
  router.put('/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, barcode, category, selling_price, cost_price, stock, min_stock, image_url } = req.body;
    let finalImage = image_url;
    if (req.file) finalImage = `/uploads/${req.file.filename}`;
    db.run(
      `UPDATE products SET name=?, barcode=?, category=?, selling_price=?, cost_price=?, stock=?, min_stock=?, image_url=? WHERE id=?`,
      [name, barcode, category, selling_price, cost_price, stock, min_stock, finalImage, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes, success: true });
      }
    );
  });

  // حذف منتج
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM products WHERE id = ?', id, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes, success: true });
    });
  });

  return router;
};