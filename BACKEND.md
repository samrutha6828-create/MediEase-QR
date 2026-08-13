# MediEase Backend & Database Architecture

This document provides complete developer instructions for configuring, initializing, and managing the MediEase full-stack backend and database.

---

## 🛠️ Technology Stack

* **Runtime & Framework**: Node.js (`v24.x`), Next.js App Router (`v16.3.0`)
* **Database ORM**: Prisma ORM (`v6.19.3`)
* **Database Engine**: SQLite (`prisma/dev.db`) for local development, production-ready for PostgreSQL / MySQL.
* **Type Safety**: TypeScript (`v5.x`)

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the template to create your local `.env` file:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
STAFF_ACCESS_KEY="mediease-staff-2026"
IOT_DEVICE_SECRET="mediease-iot-secret-key-2026"
```

### 3. Initialize & Seed Database
Sync the Prisma schema to create tables and seed default hospital data:
```bash
# Push schema to SQLite database
npm run db:push

# Seed default hospital & doctor records
npm run db:seed
```

### 4. Run Automated End-to-End Tests
```bash
npm run test:e2e
```

---

## 🟢 Running the Application & Verification

### Start Development Server
```bash
npm run dev
```

### Verify Health Endpoint
Open `http://localhost:3000/api/health` in your browser or run:
```bash
curl http://localhost:3000/api/health
```

Expected JSON response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development",
    "database": "connected",
    "counts": {
      "hospitals": 1,
      "patients": 2,
      "doctors": 3,
      "appointments": 2
    }
  },
  "timestamp": "2026-08-13T23:25:00.000Z"
}
```

---

## 📂 API Reference

| Endpoint | Method | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Public | Database & server health check |
| `/api/hospitals/qr` | GET | Public | Resolves hospital QR code to details |
| `/api/hospitals/qr/generate` | GET | Staff Auth | Generates hospital QR Code PNG image |
| `/api/doctors` | GET | Public | Fetches active doctors by hospital |
| `/api/doctors/[id]/availability` | GET | Public | Calculates slot availability for a date |
| `/api/patients` | POST, GET | Public | Identifies/creates patient records with deduplication |
| `/api/appointments` | POST | Public | Authoritative booking & queue token assignment |
| `/api/appointments/[id]` | GET | Public | Retrieves appointment details |
| `/api/queue/[appointmentId]` | GET | Public | Deterministic queue position & status (5s poll) |
| `/api/assistance` | POST, GET | Public | Patient assistance request & status lookup |
| `/api/staff/login` | POST | Public | Staff passcode authentication |
| `/api/staff/queue` | GET | Staff Auth | Full queue & metrics for Staff Dashboard |
| `/api/staff/queue/call-next` | POST | Staff Auth | Advances queue (SERVING next waiting patient) |
| `/api/staff/queue/update-status` | POST | Staff Auth | Updates appointment & queue status |
| `/api/staff/assistance` | GET | Staff Auth | Retrieves active assistance & IoT alerts |
| `/api/staff/assistance/update-status` | POST | Staff Auth | Updates assistance request status |
| `/api/iot/assistance` | POST | IoT Secret | Webhook endpoint for physical ESP32 buttons |
