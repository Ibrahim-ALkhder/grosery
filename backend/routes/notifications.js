const express = require('express');
const db = require('../database');
const dateHelper = require('../utils/dateHelper');
const router = express.Router();

// وسيط التحقق من المستخدم
const verifyUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }
  db.get('SELECT * FROM users WHERE id = ? AND status = "active"', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(403).json({ error: 'Forbidden: User not found or inactive' });
    req.user = user;
    next();
  });
};

router.use(verifyUser);

// إرسال إشعار
router.post('/send', (req, res) => {
  const { title, message, targetRole } = req.body;
  const sender = req.user;

  // التحقق من الصلاحيات
  if (sender.role === 'admin' && sender.username !== 'admin1' && targetRole === 'admins') {
    return res.status(403).json({ error: 'Only super admin can send notifications to admins.' });
  }
  if (sender.role === 'cashier') {
    return res.status(403).json({ error: 'Cashiers cannot send notifications.' });
  }

  // تحديد المستلمين
  let recipientQuery = 'SELECT id FROM users WHERE status = "active"';
  const recipientParams = [];
  if (targetRole === 'admins') {
    recipientQuery += ' AND role = "admin"';
  } else if (targetRole === 'cashiers') {
    recipientQuery += ' AND role = "cashier"';
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      `INSERT INTO notifications (sender_id, sender_name, sender_role, title, message, target_role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sender.id, sender.name, sender.role, title, message, targetRole, dateHelper.now()],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        const notificationId = this.lastID;

        db.all(recipientQuery, recipientParams, (err, recipients) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          if (recipients.length === 0) {
            db.run('COMMIT');
            return res.json({ success: true, notificationId, message: 'No recipients found' });
          }

          const stmt = db.prepare(`INSERT INTO notification_recipients (notification_id, recipient_id) VALUES (?, ?)`);
          recipients.forEach(r => stmt.run(notificationId, r.id));
          stmt.finalize(err => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            db.run('COMMIT', (err) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ success: true, notificationId, recipientsCount: recipients.length });
            });
          });
        });
      }
    );
  });
});

// جلب إشعارات المستخدم الحالي
router.get('/', (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT n.*, nr.is_read, nr.read_at
     FROM notifications n
     JOIN notification_recipients nr ON n.id = nr.notification_id
     WHERE nr.recipient_id = ?
     ORDER BY n.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(row => {
        row.created_at = dateHelper.toLocal(row.created_at);
        if (row.read_at) row.read_at = dateHelper.toLocal(row.read_at);
      });
      res.json(rows);
    }
  );
});

// عدد الإشعارات غير المقروءة
router.get('/unread-count', (req, res) => {
  const userId = req.user.id;
  db.get(
    `SELECT COUNT(*) as count FROM notification_recipients WHERE recipient_id = ? AND is_read = 0`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: row.count });
    }
  );
});

// تحديد إشعار كمقروء
router.put('/:id/read', (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  db.run(
    `UPDATE notification_recipients SET is_read = 1, read_at = ? WHERE notification_id = ? AND recipient_id = ?`,
    [dateHelper.now(), notificationId, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, changes: this.changes });
    }
  );
});

// تحديد الكل كمقروء
router.put('/read-all', (req, res) => {
  const userId = req.user.id;
  db.run(
    `UPDATE notification_recipients SET is_read = 1, read_at = ? WHERE recipient_id = ? AND is_read = 0`,
    [dateHelper.now(), userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, changes: this.changes });
    }
  );
});

module.exports = router;