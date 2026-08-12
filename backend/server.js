const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || '*';

// Wrap Express with HTTP Server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MediEase QR backend connected'
  });
});

// GET /api/doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.all('SELECT * FROM doctors');
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patients
app.post('/api/patients', async (req, res) => {
  const { name, phone, age } = req.body;
  if (!name || !phone || age === undefined) {
    return res.status(400).json({ error: 'name, phone, and age are required' });
  }
  try {
    const result = await db.run(
      'INSERT INTO patients (name, phone, age) VALUES (?, ?, ?)',
      [name, phone, age]
    );
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [result.id]);
    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
  const { patientId, doctorId, date } = req.body;
  if (!patientId || !doctorId || !date) {
    return res.status(400).json({ error: 'patientId, doctorId, and date are required' });
  }
  try {
    // Check if patient and doctor exist
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Generate sequential token for the current date (A-001, A-002, ...)
    const lastAppt = await db.get(
      'SELECT token FROM appointments WHERE date = ? ORDER BY id DESC LIMIT 1',
      [date]
    );

    let nextNum = 1;
    if (lastAppt && lastAppt.token) {
      const match = lastAppt.token.match(/^A-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const token = `A-${String(nextNum).padStart(3, '0')}`;

    const apptResult = await db.run(
      'INSERT INTO appointments (patientId, doctorId, date, token, status) VALUES (?, ?, ?, ?, ?)',
      [patientId, doctorId, date, token, 'waiting']
    );

    await db.run(
      'INSERT INTO queue (appointmentId, token, status) VALUES (?, ?, ?)',
      [apptResult.id, token, 'waiting']
    );

    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [apptResult.id]);
    
    // Notify clients that queue has updated
    io.emit('queueUpdated');

    res.status(201).json({ appointment, token });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/appointments/:id
app.get('/api/appointments/:id', async (req, res) => {
  const apptId = req.params.id;
  try {
    const query = `
      SELECT 
        a.id AS appointmentId,
        a.patientId,
        a.token,
        a.status AS appointmentStatus,
        p.name AS patientName,
        d.name AS doctorName,
        d.department
      FROM appointments a
      JOIN patients p ON a.patientId = p.id
      JOIN doctors d ON a.doctorId = d.id
      WHERE a.id = ?
    `;
    const appt = await db.get(query, [apptId]);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appt);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queue/summary
app.get('/api/queue/summary', async (req, res) => {
  try {
    const servingRow = await db.get("SELECT token FROM queue WHERE status = 'current' LIMIT 1");
    const waitingCountObj = await db.get("SELECT COUNT(*) AS count FROM queue WHERE status = 'waiting'");
    const servedCountObj = await db.get("SELECT COUNT(*) AS count FROM queue WHERE status = 'served'");

    res.json({
      serving: servingRow ? servingRow.token : 'None',
      waiting: waitingCountObj.count,
      served: servedCountObj.count
    });
  } catch (error) {
    console.error('Error fetching queue summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queue
app.get('/api/queue', async (req, res) => {
  try {
    const query = `
      SELECT 
        q.id AS queueId,
        q.token,
        q.status AS queueStatus,
        p.id AS patientId,
        p.name AS patientName,
        p.phone AS patientPhone,
        p.age AS patientAge,
        d.id AS doctorId,
        d.name AS doctorName,
        d.department
      FROM queue q
      JOIN appointments a ON q.appointmentId = a.id
      JOIN patients p ON a.patientId = p.id
      JOIN doctors d ON a.doctorId = d.id
      WHERE q.status != 'served'
      ORDER BY q.id ASC
    `;
    const queue = await db.all(query);
    const formattedQueue = queue.map(row => ({
      id: row.queueId,
      token: row.token,
      status: row.queueStatus,
      patient: {
        id: row.patientId,
        name: row.patientName,
        phone: row.patientPhone,
        age: row.patientAge
      },
      doctor: {
        id: row.doctorId,
        name: row.doctorName,
        department: row.department
      }
    }));
    res.json(formattedQueue);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queue/next
app.post('/api/queue/next', async (req, res) => {
  try {
    // 1. Mark current patient as served
    const currentQueueItem = await db.get("SELECT * FROM queue WHERE status = 'current'");
    if (currentQueueItem) {
      await db.run("UPDATE queue SET status = 'served' WHERE id = ?", [currentQueueItem.id]);
      await db.run("UPDATE appointments SET status = 'served' WHERE id = ?", [currentQueueItem.appointmentId]);
    }

    // 2. Find next waiting patient
    const nextQueueItem = await db.get("SELECT * FROM queue WHERE status = 'waiting' ORDER BY id ASC LIMIT 1");
    if (!nextQueueItem) {
      io.emit('queueUpdated'); // Still notify queue changed (current served)
      return res.status(200).json({ message: 'No waiting patients in the queue', patient: null });
    }

    // 3. Mark next waiting patient as current
    await db.run("UPDATE queue SET status = 'current' WHERE id = ?", [nextQueueItem.id]);
    await db.run("UPDATE appointments SET status = 'current' WHERE id = ?", [nextQueueItem.appointmentId]);

    // 4. Get detailed information
    const query = `
      SELECT 
        q.id AS queueId,
        q.token,
        q.status AS queueStatus,
        p.id AS patientId,
        p.name AS patientName,
        p.phone AS patientPhone,
        p.age AS patientAge,
        d.id AS doctorId,
        d.name AS doctorName,
        d.department
      FROM queue q
      JOIN appointments a ON q.appointmentId = a.id
      JOIN patients p ON a.patientId = p.id
      JOIN doctors d ON a.doctorId = d.id
      WHERE q.id = ?
    `;
    const row = await db.get(query, [nextQueueItem.id]);
    const formattedPatient = {
      id: row.queueId,
      token: row.token,
      status: row.queueStatus,
      patient: {
        id: row.patientId,
        name: row.patientName,
        phone: row.patientPhone,
        age: row.patientAge
      },
      doctor: {
        id: row.doctorId,
        name: row.doctorName,
        department: row.department
      }
    };

    // Emit real-time queue update
    io.emit('queueUpdated');

    res.json(formattedPatient);
  } catch (error) {
    console.error('Error serving next patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queue/serve
app.post('/api/queue/serve', async (req, res) => {
  try {
    const currentQueueItem = await db.get("SELECT * FROM queue WHERE status = 'current'");
    if (!currentQueueItem) {
      return res.status(404).json({ error: 'No active current patient to serve' });
    }
    await db.run("UPDATE queue SET status = 'served' WHERE id = ?", [currentQueueItem.id]);
    await db.run("UPDATE appointments SET status = 'served' WHERE id = ?", [currentQueueItem.appointmentId]);
    
    // Emit real-time queue update
    io.emit('queueUpdated');

    res.json({ message: 'Current patient successfully served' });
  } catch (error) {
    console.error('Error serving current patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/iot/assistance-button
app.post('/api/iot/assistance-button', async (req, res) => {
  let { deviceId, patientId } = req.body;
  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required' });
  }
  try {
    // If patientId is missing, find current/waiting patient from active queue or latest patient
    if (!patientId) {
      const activeQueueItem = await db.get(`
        SELECT a.patientId 
        FROM queue q 
        JOIN appointments a ON q.appointmentId = a.id 
        WHERE q.status != 'served'
        ORDER BY q.id ASC LIMIT 1
      `);
      if (activeQueueItem) {
        patientId = activeQueueItem.patientId;
      } else {
        const latestPatient = await db.get('SELECT id FROM patients ORDER BY id DESC LIMIT 1');
        if (latestPatient) {
          patientId = latestPatient.id;
        } else {
          return res.status(404).json({ error: 'No active patient found to attach alert' });
        }
      }
    }

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    let device = await db.get('SELECT * FROM iot_devices WHERE deviceId = ?', [deviceId]);
    if (!device) {
      const devResult = await db.run(
        'INSERT INTO iot_devices (deviceId, patientId) VALUES (?, ?)',
        [deviceId, patientId]
      );
      device = { id: devResult.id, deviceId, patientId };
    } else {
      await db.run('UPDATE iot_devices SET patientId = ? WHERE id = ?', [patientId, device.id]);
    }

    const createdAt = new Date().toISOString();
    const alertResult = await db.run(
      'INSERT INTO alerts (deviceId, patientId, type, status, createdAt) VALUES (?, ?, ?, ?, ?)',
      [device.id, patientId, 'assistance', 'active', createdAt]
    );

    const alert = await db.get(`
      SELECT 
        a.id,
        a.deviceId AS dbDeviceId,
        d.deviceId AS iotDeviceId,
        a.patientId,
        p.name AS patientName,
        appt.token AS patientToken,
        a.type,
        a.status,
        a.createdAt
      FROM alerts a
      JOIN iot_devices d ON a.deviceId = d.id
      JOIN patients p ON a.patientId = p.id
      LEFT JOIN appointments appt ON a.patientId = appt.patientId
      WHERE a.id = ?
    `, [alertResult.id]);

    // Emit assistance alert event
    io.emit('assistanceRequested', alert);

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error triggering assistance alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.deviceId AS dbDeviceId,
        d.deviceId AS iotDeviceId,
        a.patientId,
        p.name AS patientName,
        appt.token AS patientToken,
        a.type,
        a.status,
        a.createdAt
      FROM alerts a
      JOIN iot_devices d ON a.deviceId = d.id
      JOIN patients p ON a.patientId = p.id
      LEFT JOIN appointments appt ON a.patientId = appt.patientId
      WHERE a.status = 'active'
      ORDER BY a.id DESC
    `;
    const alerts = await db.all(query);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alerts/:id/resolve
app.post('/api/alerts/:id/resolve', async (req, res) => {
  const alertId = req.params.id;
  try {
    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [alertId]);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    await db.run("UPDATE alerts SET status = 'resolved' WHERE id = ?", [alertId]);
    
    // Notify clients that an alert was resolved
    io.emit('queueUpdated');

    res.json({ message: `Alert ${alertId} resolved successfully` });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static frontend build files if present
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Initialize database and start HTTP server
db.initDb()
  .then(() => {
    server.listen(port, () => {
      console.log(`Backend server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
