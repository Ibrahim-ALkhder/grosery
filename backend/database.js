const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // جدول المستخدمين (الكاشير والمديرين)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'cashier',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // جدول المنتجات
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      category TEXT,
      selling_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // جدول المعاملات مع cashier_id
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cashier_id INTEGER,
      cashier_name TEXT,
      total REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      payment_method TEXT NOT NULL,
      cash_given REAL,
      change_due REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cashier_id) REFERENCES users(id)
    )`);

    // جدول تفاصيل المعاملات
    db.run(`CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);
    // جدول الإشعارات
db.run(`CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// جدول استقبال الإشعارات
db.run(`CREATE TABLE IF NOT EXISTS notification_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  FOREIGN KEY (notification_id) REFERENCES notifications(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
)`);

    // إدراج مدير افتراضي إذا لم يكن موجوداً
    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, row) => {
      if (row.count === 0) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('admin123', salt);
        db.run(
          `INSERT INTO users (name, email, username, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Admin', 'admin@example.com', 'admin', hash, '', 'admin', 'active']
        );
        console.log('Default admin created (username: admin, password: admin123)');
      }
    });

    // إدراج كاشير تجريبي
    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'cashier'", (err, row) => {
      if (row.count === 0) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('1234', salt);
        const cashiers = [
          ['أحمد محمد', 'ahmed@example.com', '1001', hash, '0555555555'],
          ['سارة علي', 'sara@example.com', '1002', hash, '0566666666'],
          ['خالد عمر', 'khaled@example.com', '1003', hash, '0577777777']
        ];
        const stmt = db.prepare(`INSERT INTO users (name, email, username, password, phone, role, status) VALUES (?, ?, ?, ?, ?, 'cashier', 'active')`);
        cashiers.forEach(c => stmt.run(c[0], c[1], c[2], c[3], c[4]));
        stmt.finalize();
        console.log('Sample cashiers inserted');
      }
    });
  });
}

module.exports = db;