# Video Link: https://youtu.be/6P3ECI0k9nM

# MediBook — Clinic Appointment System

A RESTful backend for managing clinic patients, doctors, appointment bookings, cancellations, reports, and waiting lists. Built with **Node.js**, **Express**, **MySQL**, and **Redis** for the Advanced Backend Development summative assessment.

## 1. Overview

MediBook supports fixed **30-minute appointment slots** during clinic hours (**09:00–17:00**), with a maximum of **12 active appointments per doctor per day**. It handles cancellations and refunds, calculates doctor statistics using SQL, records audit events, and manages waiting patients using Redis.

Appointment times are entered as `YYYY-MM-DD HH:mm:ss` in **Rwanda local time (UTC+02:00)**. The last valid slot begins at **16:30**.

## 2. Technology Stack

| Technology | Purpose |
| --- | --- |
| Node.js + Express | HTTP API and business logic |
| MySQL + `mysql2/promise` | Relational data, parameterized SQL, transactions |
| Redis | Ordered appointment waitlists and worker locks |
| Node.js `fs/promises` | Asynchronous JSON-lines audit logging |
| Jest | Unit tests for refund and slot-validation functions |
| HTML, CSS, JSON locale files | Bilingual feedback page |
| Docker (optional) | Running a local Redis server |

No ORM is used. The database contains **exactly three tables**.

## 3. Project Structure

```text
medibook/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── locales/
│   ├── en.json
│   └── fr.json
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   ├── controllers/
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── appointmentController.js
│   │   └── reportController.js
│   ├── models/
│   │   ├── patientModel.js
│   │   ├── doctorModel.js
│   │   ├── appointmentModel.js
│   │   └── reportModel.js
│   ├── routes/
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── reportRoutes.js
│   │   └── feedbackRoutes.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validateId.js
│   └── utils/
│       ├── validateSlot.js
│       ├── calculateRefund.js
│       ├── auditLogger.js
│       └── notification.js
├── tests/
│   ├── refund.test.js
│   └── ValidateSlot.test.js
├── worker.js
├── server.js
├── Schema-diagram.png
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 4. Database Design — Parts A and B

The schema is normalized to **Third Normal Form (3NF)** and consists of:

| Table | Responsibility | Key relationships |
| --- | --- | --- |
| `patients` | Stores patient name, unique email, and phone number | One patient can have many appointments |
| `doctors` | Stores doctor name, specialty, consultation fee, and room | One doctor can have many appointments |
| `appointments` | Stores patient/doctor references, appointment time, status, fee, cancellation time, and refund | Foreign keys reference `patients` and `doctors` |

The separate patient and doctor tables avoid repeating their details for every appointment. In `appointments`, the generated `active_slot` column is set to the appointment time only for `booked` records. The unique constraint on `(doctor_id, active_slot)` prevents two active bookings for the same doctor at the same time, while allowing cancelled slots to be booked again.

Primary keys, foreign keys, `NOT NULL`, `UNIQUE`, and `CHECK` constraints protect data integrity. The visual design is provided in [`Schema-diagram.png`](Schema-diagram.png); the executable definition is in [`database/schema.sql`](database/schema.sql).

The [`database/seed.sql`](database/seed.sql) file contains sample patients, doctors, and appointments, including a doctor with no appointments and a doctor-day close to the 12-slot cap. Sample data is fictional and intended for local demonstration.

## 5. Setup and Installation

### Prerequisites

- Node.js and npm
- A running MySQL server (and MySQL Workbench or equivalent SQL client)
- A running Redis server (Docker Desktop can be used)
- Git
- Postman or another HTTP client for testing API endpoints

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env` in the project root and update the MySQL password. Do not commit `.env`.

```dotenv
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=medibook
DB_PORT=3306
REDIS_URL=redis://127.0.0.1:6379
```

### Create and populate the MySQL database

Run the scripts in order, using MySQL Workbench or another MySQL client:

1. Execute `database/schema.sql` to create `medibook` and its three tables.
2. Execute `database/seed.sql` **once** to insert example records.

To check the tables:

```sql
USE medibook;
SHOW TABLES;
SELECT COUNT(*) AS patients FROM patients;
SELECT COUNT(*) AS doctors FROM doctors;
SELECT COUNT(*) AS appointments FROM appointments;
```

The seed script uses fixed sample IDs; running it twice can cause duplicate-key errors.

### Start Redis

With Docker Desktop running:

```bash
docker run -d --name medibook-redis -p 6379:6379 redis:7
```

If the container already exists, use `docker start medibook-redis` instead. Verify with:

```bash
docker exec medibook-redis redis-cli ping
```

Expected output: `PONG`.

### Start the API and worker

In separate terminals:

```bash
npm run dev
```

```bash
npm run worker
```

The API runs at `http://localhost:5000` by default. `GET /` checks the API and its MySQL connection. Redis is needed for waitlists and promotion; a Redis connection refusal commonly means its container is stopped.

## 6. API Endpoints — Part C

### Patient and doctor management

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/patients` | Create patient |
| `GET` | `/patients` | List patients |
| `GET` | `/patients/:id` | Get patient |
| `PUT` | `/patients/:id` | Update patient |
| `DELETE` | `/patients/:id` | Delete patient without linked appointments |
| `POST` | `/doctors` | Create doctor |
| `GET` | `/doctors` | List doctors |
| `GET` | `/doctors/:id` | Get doctor |
| `PUT` | `/doctors/:id` | Update doctor |
| `DELETE` | `/doctors/:id` | Delete doctor without linked appointments |

### Appointments and waiting lists

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/appointments` | Book an appointment |
| `GET` | `/appointments` | List appointments |
| `PATCH` | `/appointments/:id/cancel` | Cancel and calculate refund |
| `POST` | `/appointments/waitlist` | Join the queue for an unavailable slot |

**Example booking:**

```http
POST /appointments
Content-Type: application/json
```

```json
{
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_time": "2026-12-18 11:30:00"
}
```

The server uses the consultation fee recorded for the doctor; the client does not set the fee.

**Example cancellation:**

```http
PATCH /appointments/14/cancel
```

Replace `14` with the actual appointment ID. No request body is needed.

### Reports

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/reports/doctors` | Doctor totals, active bookings, net fee revenue and upcoming bookings |
| `GET` | `/reports/doctors/:id` | One doctor’s statistics and seven-day utilization, including days with no bookings |
| `GET` | `/reports/daily` | Active bookings and utilization by doctor/day for the current seven-calendar-day window |
| `GET` | `/reports/busy-days` | Doctor/date combinations above 80% of capacity |

A day is **busy at 10 or more active appointments**, because 10/12 is greater than 80%. The daily report may return `[]` when appointments fall outside the current seven-day window. Revenue reported as `fee_paid - refund_amount` is a database-based financial estimate, not proof of actual payment settlement.

### Feedback

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/feedback` | Feedback page in default English |
| `GET` | `/feedback?lang=en` | English version |
| `GET` | `/feedback?lang=fr` | French version |

Unsupported language codes fall back to English. Date formatting uses `Intl.DateTimeFormat` and the `Africa/Kigali` time zone. The current form displays a confirmation alert; it does not persist submitted feedback.

## 7. Booking and Cancellation Rules

- Appointments must be in the future.
- Working hours are **09:00–17:00**; valid appointment starts are `09:00`, `09:30`, …, `16:30`.
- Each doctor may have at most **12 active appointments per calendar day**.
- The same doctor/time combination cannot be held by two active appointments.
- Booking runs in a MySQL transaction and locks the doctor row while checking the daily cap.
- Cancellation updates the existing appointment record rather than deleting it; the cancellation status and refund are saved together inside a transaction.

### Refund policy

| Time remaining before appointment | Refund |
| --- | --- |
| **More than 48 hours** | **100%** of fee |
| **From 24 through 48 hours**, including exactly 24 and 48 | **50%** of fee |
| **Less than 24 hours** | **0%** |

Refund amounts are calculated by the server using the recorded appointment time and fee. They cannot be supplied by the client.

## 8. Audit Logging — Part D

The `auditLogger` utility uses asynchronous `fs/promises` functions to create `logs/` automatically and append one JSON object per line to `logs/audit.log`. Successful bookings and cancellations record identifiers, action names, and timestamps. A filesystem logging error is caught and logged to the console; it does not reverse a successful API request.

The log file is excluded from Git because it is generated at runtime.

## 9. Redis Waitlist and Worker — Part E

When a slot is occupied or a doctor's day has reached capacity, a patient can call `POST /appointments/waitlist`. Redis stores waiting patients in arrival order using lists keyed by doctor and appointment time.

The independently run `worker.js` checks the queues for newly available slots. It attempts to promote the first eligible patient through the same MySQL booking rules. If MySQL rejects a promotion, the queued patient is retained for another attempt. A Redis lock reduces the risk of two workers processing the same queue at once.

After a successful promotion, the worker records the event and adds a notification job to the Redis `notifications:pending` list. Normal bookings also enqueue notification jobs. The separate worker processes these jobs and records simulated email/SMS confirmations in `logs/audit.log`. No real messages are sent.

The queue and MySQL transaction are separate operations: a booking can succeed even if Redis is unavailable. This implementation does not guarantee exactly-once notification processing.


## 10. Unit Tests — Part F

Jest tests cover pure functions without requiring a live MySQL or Redis server:

- Refund amounts at greater than 48 hours, exactly 48 hours, between 24 and 48 hours, exactly 24 hours, and below 24 hours.
- Slot validation for opening and closing times, 30-minute alignment, and past dates.

Run:

```bash
npm test
```

The two Jest suites contain 12 tests. The latest local `npm test` run reported 12 passed tests in 2 passed suites. This verifies the tested utility functions; live MySQL/Redis workflows should also be demonstrated.

## 11. Localization — Part G

The `/feedback` route renders a form with text supplied by `locales/en.json` or `locales/fr.json`. The active language controls the title, instructions, questions, and date format. Unknown language values default to English. Each question uses a `<textarea>`.

## 12. Short Technical Justifications — Parts C, D and E

### Part C — REST API, database transactions and reporting

**REST and layers.** Routes map HTTP methods and URLs to controllers; controllers validate inputs and apply business rules; models contain the SQL. This keeps responsibilities separate and supports maintenance. Queries use `mysql2` placeholders rather than concatenating client input into SQL. The root health-check query is also delegated to a model function in the final local code.

**Booking and concurrency.** Future-date and clinic-hour validation happens before booking. A MySQL transaction locks the doctor row before checking the 12-appointment daily cap and inserting a booking, helping serialize competing requests for that doctor. The database-level unique constraint is a second protection against identical active slots.

**Cancellation and refunds.** Refund tiers are calculated from server-side time and stored fees. One transaction saves the cancellation status and refund amount together. Cancelled records remain available for history while their appointment slots can be reused.

**Statistics.** Reports use SQL joins, `COUNT`, `SUM`, `GROUP BY`, and `HAVING` rather than calculating report totals from raw rows in JavaScript. `LEFT JOIN` keeps doctors with zero appointments visible. Capacity utilization is measured against 12 appointments per doctor/day.

### Part D — Asynchronous file audit

The logger uses non-blocking filesystem operations so disk writes do not block request handling. JSON-lines format is simple to append to and inspect. Errors in logging are caught separately to avoid failing an otherwise successful booking or cancellation.

### Part E — Redis queue and worker

Redis lists preserve waiting order without adding tables to the three-entity relational schema. A separate worker handles promotion so the API can respond without performing queue processing inside an HTTP request. Failed promotions remain on the waitlist for retry. Confirmed bookings are added to a dedicated `notifications:pending` Redis list for worker processing. The worker simulates notifications by writing audit-log entries, without requiring external SMS/email credentials. Redis queueing occurs outside the MySQL booking transaction, so a Redis failure can prevent a notification job from being added even when the booking succeeds.
