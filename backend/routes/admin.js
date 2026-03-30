const express = require('express');
const db = require('../database');
const bcrypt = require('bcryptjs');
const dateHelper = require('../utils/dateHelper');
const router = express.Router();

// ==================== وسيط التحقق من المدير ====================
const verifyAdmin = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }
  db.get('SELECT * FROM users WHERE id = ? AND role = "admin" AND status = "active"', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(403).json({ error: 'Forbidden: Not an admin or inactive' });
    req.loggedInUser = user;
    next();
  });
};

router.use(verifyAdmin);

// ==================== إدارة المستخدمين ====================

// جلب جميع المستخدمين (حسب الصلاحية)
router.get('/users', (req, res) => {
  const loggedInUser = req.loggedInUser;
  let query = '';
  let params = [];

  if (loggedInUser.username === 'admin1') {
    // المدير الرئيسي يرى كل المستخدمين
    query = 'SELECT id, name, email, username, phone, role, status, created_at FROM users ORDER BY created_at DESC';
  } else {
    // المدير العادي يرى فقط الكاشيرات (role = cashier)
    query = 'SELECT id, name, email, username, phone, role, status, created_at FROM users WHERE role = "cashier" ORDER BY created_at DESC';
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// جلب مستخدم محدد (مع التحقق من الصلاحية)
router.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const loggedInUser = req.loggedInUser;

  db.get(`SELECT id, name, email, username, phone, role, status, created_at FROM users WHERE id = ?`, [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // إذا كان المستخدم الحالي ليس admin1، ولا يمكنه رؤية أي مستخدم من نوع admin
    if (loggedInUser.username !== 'admin1' && user.role === 'admin') {
      return res.status(403).json({ error: 'You do not have permission to view admin accounts.' });
    }

    res.json(user);
  });
});

// إضافة كاشير جديد (مع منع إضافة Admin للمدير العادي)
router.post('/users', (req, res) => {
  const { name, email, username, password, phone, role = 'cashier', status = 'active' } = req.body;
  const loggedInUser = req.loggedInUser;

  // منع المدير العادي من إنشاء حساب Admin
  if (loggedInUser.username !== 'admin1' && role === 'admin') {
    return res.status(403).json({ error: 'You do not have permission to create admin accounts.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  db.run(
    `INSERT INTO users (name, email, username, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, username, hash, phone, role, status],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

// تعديل كاشير (مع منع تعديل Admin للمدير العادي)
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, username, phone, role, status } = req.body;
  const loggedInUser = req.loggedInUser;

  db.get('SELECT role, username FROM users WHERE id = ?', [id], (err, targetUser) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // لا يمكن لأحد تعديل admin1
    if (targetUser.username === 'admin1') {
      return res.status(403).json({ error: 'The primary admin account cannot be modified.' });
    }

    // إذا كان المستخدم الحالي ليس admin1، فلا يمكنه تعديل أي مستخدم من نوع admin
    if (loggedInUser.username !== 'admin1' && targetUser.role === 'admin') {
      return res.status(403).json({ error: 'You do not have permission to modify admin accounts.' });
    }

    // إذا كان المستخدم الحالي ليس admin1، فلا يمكنه تعيين دور admin (إذا تغير الدور)
    if (loggedInUser.username !== 'admin1' && role === 'admin') {
      return res.status(403).json({ error: 'You do not have permission to assign admin role.' });
    }

    db.run(
      `UPDATE users SET name=?, email=?, username=?, phone=?, role=?, status=? WHERE id=?`,
      [name, email, username, phone, role, status, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes, success: true });
      }
    );
  });
});

// ==================== مسارات الحذف ====================

// حذف مستخدم (مع قواعد صارمة)
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const loggedInUser = req.loggedInUser;

  db.get('SELECT username, role FROM users WHERE id = ?', [id], (err, targetUser) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // منع حذف الحساب الأساسي admin1
    if (targetUser.username === 'admin1') {
      return res.status(403).json({ error: 'The primary admin account cannot be deleted.' });
    }

    // إذا كان المستخدم الحالي ليس admin1
    if (loggedInUser.username !== 'admin1') {
      // لا يمكنه حذف أي مستخدم من نوع admin
      if (targetUser.role === 'admin') {
        return res.status(403).json({ error: 'You do not have permission to delete admin accounts.' });
      }
      // لا يمكنه حذف نفسه (يجب استخدام self-delete)
      if (parseInt(id) === loggedInUser.id) {
        return res.status(403).json({ error: 'Please use the secure self-deletion process to delete your own account.' });
      }
      // يمكنه حذف الكاشيرات فقط
    } else {
      // admin1 يمكنه حذف أي مستخدم (عدا نفسه؟ نمنع حذف النفس أيضًا؟ يمكنه حذف نفسه؟ لا نريد حذف admin1 أصلاً، لذا نمنع)
      if (parseInt(id) === loggedInUser.id) {
        return res.status(403).json({ error: 'You cannot delete your own account.' });
      }
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, changes: this.changes });
    });
  });
});

// حذف النفس للمديرين العاديين (self-delete) - مع التحقق من كلمة المرور
router.post('/users/:id/self-delete', (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  const loggedInUser = req.loggedInUser;

  if (parseInt(id) !== loggedInUser.id) {
    return res.status(403).json({ error: 'You can only delete your own account via this endpoint.' });
  }

  // منع حذف admin1
  if (loggedInUser.username === 'admin1') {
    return res.status(403).json({ error: 'The primary admin account cannot be deleted.' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.username !== username) {
      return res.status(401).json({ error: 'Incorrect username or password. Account deletion cancelled.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect username or password. Account deletion cancelled.' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Account deleted successfully.' });
    });
  });
});

// إعادة تعيين كلمة مرور كاشير (مع منع تعديل Admin للمدير العادي)
router.post('/users/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const loggedInUser = req.loggedInUser;

  db.get('SELECT role, username FROM users WHERE id = ?', [id], (err, targetUser) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.username === 'admin1') {
      return res.status(403).json({ error: 'The primary admin account cannot be modified.' });
    }

    if (loggedInUser.username !== 'admin1' && targetUser.role === 'admin') {
      return res.status(403).json({ error: 'You do not have permission to reset password for admin accounts.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});



// ==================== إحصائيات وأداء الكاشير ====================

// إحصائيات لوحة التحكم
router.get('/stats', (req, res) => {
  const todayStart = dateHelper.startOfDayUTC();
  const todayEnd = dateHelper.endOfDayUTC();
  const startOfMonth = dateHelper.startOfMonthUTC();

  db.get('SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE created_at BETWEEN ? AND ?', [todayStart, todayEnd], (err, todaySales) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as count FROM transactions WHERE created_at BETWEEN ? AND ?', [todayStart, todayEnd], (err, todayTransactions) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE created_at >= ?', [startOfMonth], (err, monthSales) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT COUNT(*) as count FROM transactions', [], (err, totalTransactions) => {
          if (err) return res.status(500).json({ error: err.message });
          db.get('SELECT COUNT(*) as count FROM users WHERE role = "cashier"', [], (err, totalCashiers) => {
            if (err) return res.status(500).json({ error: err.message });
            db.get(`
              SELECT cashier_id, cashier_name, COUNT(*) as transactions, SUM(total) as total
              FROM transactions
              WHERE created_at BETWEEN ? AND ?
              GROUP BY cashier_id
              ORDER BY total DESC
              LIMIT 1
            `, [todayStart, todayEnd], (err, topCashier) => {
              if (err) return res.status(500).json({ error: err.message });
              db.get('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock', [], (err, lowStock) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                  todaySales: todaySales?.total || 0,
                  todayTransactions: todayTransactions?.count || 0,
                  monthSales: monthSales?.total || 0,
                  totalTransactions: totalTransactions?.count || 0,
                  totalCashiers: totalCashiers?.count || 0,
                  topCashier: topCashier || null,
                  lowStock: lowStock?.count || 0
                });
              });
            });
          });
        });
      });
    });
  });
});

// أداء الكاشير
router.get('/cashier-performance', (req, res) => {
  const { startDate, endDate, cashierId } = req.query;
  let query = `
    SELECT 
      u.id, u.name,
      COUNT(t.id) as transactions,
      COALESCE(SUM(t.total), 0) as total_sales,
      COALESCE(AVG(t.total), 0) as avg_order,
      MAX(t.created_at) as last_sale
    FROM users u
    LEFT JOIN transactions t ON u.id = t.cashier_id
  `;
  const conditions = [];
  const params = [];

  if (startDate && endDate) {
    const utcStart = dateHelper.localToUTC(startDate, '00:00:00');
    const utcEnd = dateHelper.localToUTC(endDate, '23:59:59');
    conditions.push(`t.created_at BETWEEN ? AND ?`);
    params.push(utcStart, utcEnd);
  } else if (startDate) {
    const utcStart = dateHelper.localToUTC(startDate, '00:00:00');
    conditions.push(`t.created_at >= ?`);
    params.push(utcStart);
  } else if (endDate) {
    const utcEnd = dateHelper.localToUTC(endDate, '23:59:59');
    conditions.push(`t.created_at <= ?`);
    params.push(utcEnd);
  }

  if (cashierId) {
    conditions.push(`u.id = ?`);
    params.push(cashierId);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` GROUP BY u.id ORDER BY total_sales DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(row => {
      if (row.last_sale) row.last_sale = dateHelper.toLocal(row.last_sale);
    });
    res.json(rows);
  });
});

// أفضل الكاشير
router.get('/top-cashiers', (req, res) => {
  const { period } = req.query; // 'today', 'week', 'month', 'all'
  let dateCondition = '';
  const params = [];
  const now = dateHelper.getMomentInTimezone();
  if (period === 'today') {
    const start = now.clone().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
    const end = now.clone().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
    dateCondition = `WHERE created_at BETWEEN ? AND ?`;
    params.push(start, end);
  } else if (period === 'week') {
    const start = now.clone().startOf('week').utc().format('YYYY-MM-DD HH:mm:ss');
    dateCondition = `WHERE created_at >= ?`;
    params.push(start);
  } else if (period === 'month') {
    const start = now.clone().startOf('month').utc().format('YYYY-MM-DD HH:mm:ss');
    dateCondition = `WHERE created_at >= ?`;
    params.push(start);
  }

  const query = `
    SELECT cashier_id, cashier_name, COUNT(*) as transactions, SUM(total) as total
    FROM transactions
    ${dateCondition}
    GROUP BY cashier_id
    ORDER BY total DESC
    LIMIT 5
  `;
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// آخر المعاملات
router.get('/recent-transactions', (req, res) => {
  const { limit = 10 } = req.query;
  db.all(
    `SELECT t.*, u.name as cashier_name 
     FROM transactions t
     LEFT JOIN users u ON t.cashier_id = u.id
     ORDER BY t.created_at DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(row => {
        row.created_at = dateHelper.toLocal(row.created_at);
      });
      res.json(rows);
    }
  );
});

// مبيعات كاشير معين
router.get('/users/:id/sales', (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  let query = `SELECT * FROM transactions WHERE cashier_id = ?`;
  const params = [id];
  if (startDate && endDate) {
    const utcStart = dateHelper.localToUTC(startDate, '00:00:00');
    const utcEnd = dateHelper.localToUTC(endDate, '23:59:59');
    query += ` AND created_at BETWEEN ? AND ?`;
    params.push(utcStart, utcEnd);
  } else if (startDate) {
    const utcStart = dateHelper.localToUTC(startDate, '00:00:00');
    query += ` AND created_at >= ?`;
    params.push(utcStart);
  } else if (endDate) {
    const utcEnd = dateHelper.localToUTC(endDate, '23:59:59');
    query += ` AND created_at <= ?`;
    params.push(utcEnd);
  }
  query += ` ORDER BY created_at DESC`;

  db.all(query, params, (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });
    let completed = 0;
    if (transactions.length === 0) return res.json([]);
    transactions.forEach(t => {
      t.created_at = dateHelper.toLocal(t.created_at);
      db.all('SELECT * FROM transaction_items WHERE transaction_id = ?', [t.id], (err, items) => {
        t.items = items;
        completed++;
        if (completed === transactions.length) res.json(transactions);
      });
    });
  });
});

module.exports = router;