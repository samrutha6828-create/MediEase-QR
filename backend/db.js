const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'mediease.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Helper function to run a query (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Helper function to get a single row (SELECT)
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to get all rows (SELECT)
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables and seed data
const initDb = async () => {
  // Enable foreign keys
  await run('PRAGMA foreign_keys = ON;');

  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      age INTEGER NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      date TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      FOREIGN KEY (patientId) REFERENCES patients (id),
      FOREIGN KEY (doctorId) REFERENCES doctors (id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointmentId INTEGER NOT NULL,
      token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      FOREIGN KEY (appointmentId) REFERENCES appointments (id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS iot_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL UNIQUE,
      patientId INTEGER,
      FOREIGN KEY (patientId) REFERENCES patients (id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId INTEGER,
      patientId INTEGER,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (deviceId) REFERENCES iot_devices (id),
      FOREIGN KEY (patientId) REFERENCES patients (id)
    );
  `);

  // Seed doctors if empty
  const countObj = await get('SELECT COUNT(*) AS count FROM doctors');
  if (countObj.count === 0) {
    const seedDoctors = [
      { name: 'Dr. Kumar', department: 'General Medicine' },
      { name: 'Dr. Priya', department: 'Cardiology' },
      { name: 'Dr. Ravi', department: 'Orthopedics' }
    ];
    for (const doc of seedDoctors) {
      await run('INSERT INTO doctors (name, department) VALUES (?, ?)', [doc.name, doc.department]);
    }
    console.log('Seeded initial doctors into database.');
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
