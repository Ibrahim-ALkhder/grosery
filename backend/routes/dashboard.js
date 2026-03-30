const express = require('express');
const db = require('../database');
const dateHelper = require('../utils/dateHelper');
const router = express.Router();

router.get('/', (req, res) => {
  const todayStart = dateHelper.startOfDayUTC();
  const todayEnd = dateHelper.endOfDayUTC();

  db.get(
    `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM transactions WHERE created_at BETWEEN ? AND ?`,
    [todayStart, todayEnd],
    (err, todayStats) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(
        `SELECT product_name, SUM(quantity) as total_sold FROM transaction_items
         GROUP BY product_name ORDER BY total_sold DESC LIMIT 5`,
        (err, bestSellers) => {
          if (err) return res.status(500).json({ error: err.message });

          db.all('SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC', (err, lowStock) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              todaySales: todayStats?.total || 0,
              todayTransactions: todayStats?.count || 0,
              bestSellers: bestSellers || [],
              lowStock: lowStock || []
            });
          });
        }
      );
    }
  );
});

module.exports = router;