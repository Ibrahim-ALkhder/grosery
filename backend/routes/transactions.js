const express = require('express');
const db = require('../database');
const dateHelper = require('../utils/dateHelper');
const router = express.Router();

// إتمام عملية بيع
router.post('/', async (req, res) => {
  const { cashier_id, cashier_name, items, total, tax, discount, payment_method, cash_given, change_due } = req.body;

  // التحقق من المخزون لكل منتج
  for (const item of items) {
    const product = await new Promise((resolve, reject) => {
      db.get('SELECT stock FROM products WHERE id = ?', [item.product_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!product) {
      return res.status(400).json({ error: `Product ${item.name} not found` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${item.name}. Available: ${product.stock}` });
    }
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      `INSERT INTO transactions (cashier_id, cashier_name, total, tax, discount, payment_method, cash_given, change_due, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cashier_id, cashier_name, total, tax, discount, payment_method, cash_given, change_due, dateHelper.now()],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        const transactionId = this.lastID;

        let completed = 0;
        let hasError = false;

        items.forEach(item => {
          db.run(
            `INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price)
             VALUES (?, ?, ?, ?, ?)`,
            [transactionId, item.product_id, item.name, item.quantity, item.price],
            function(err) {
              if (err && !hasError) {
                hasError = true;
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              db.run(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id],
                function(err) {
                  if (err && !hasError) {
                    hasError = true;
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                  }

                  completed++;
                  if (completed === items.length && !hasError) {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                      }
                      res.json({ transactionId, success: true });
                    });
                  }
                }
              );
            }
          );
        });
      }
    );
  });
});

// جلب جميع المعاملات مع إمكانية التصفية بالتاريخ
router.get('/', (req, res) => {
  const { date } = req.query;
  let query = 'SELECT * FROM transactions';
  let params = [];
  if (date) {
    // تحويل التاريخ المحلي المطلوب إلى نطاق UTC للاستعلام
    const startUTC = dateHelper.localToUTC(date, '00:00:00');
    const endUTC = dateHelper.localToUTC(date, '23:59:59');
    query += ' WHERE created_at BETWEEN ? AND ?';
    params = [startUTC, endUTC];
  }
  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });

    if (transactions.length === 0) return res.json([]);
    let completed = 0;
    transactions.forEach(t => {
      // تحويل created_at إلى التوقيت المحلي قبل الإرسال
      t.created_at = dateHelper.toLocal(t.created_at);
      db.all('SELECT * FROM transaction_items WHERE transaction_id = ?', [t.id], (err, items) => {
        t.items = items;
        completed++;
        if (completed === transactions.length) res.json(transactions);
      });
    });
  });
});

// جلب معاملة محددة
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, transaction) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.created_at = dateHelper.toLocal(transaction.created_at);
    db.all('SELECT * FROM transaction_items WHERE transaction_id = ?', [id], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      transaction.items = items;
      res.json(transaction);
    });
  });
});

module.exports = router;