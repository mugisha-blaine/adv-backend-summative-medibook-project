# Final Assessment — Backend Development

**Weight:** 30% of final grade
**Duration:** 2 weeks
**Mode:** Individual project
**Stack (mandatory):** Node.js, Express.js, MySQL (with parameterized queries only), Redis

---

## Scenario — "MediBook" Clinic Appointment System

A community clinic wants a backend service for booking doctor appointments. Doctors see patients in fixed 30-minute slots during working hours (09:00–17:00), each doctor can handle at most **12 appointments per day**, and the clinic administrator needs reports. You will design the database, build the API, and handle the operational concerns (background jobs, logging, testing).

**Entity limit:** Your database must contain **exactly 3 entities**:

| Entity | Purpose |
|---|---|
| `patients` | People who book appointments |
| `doctors` | Doctors with a specialty, consultation fee, and room |
| `appointments` | A patient's booking with a doctor at a specific date/time (links the other two) |

You may add columns as needed, but no additional tables (lookup/locale JSON files don't count).

---

## Part A — Database Design & Normalization

The clinic currently tracks everything in this single spreadsheet:

| appt_ref | patient_name | patient_email | patient_phone | doctor_name | specialty | consultation_fee | room | appt_datetime | amount_paid | booked_on |
|---|---|---|---|---|---|---|---|---|---|---|
| AP-001 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:00 | 150.00 | 2026-07-01 |
| AP-002 | Kojo Owusu | kojo@mail.com | 0555-333-444 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:30 | 120.00 | 2026-07-02 |
| AP-003 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Adjei | Paediatrics | 100.00 | R-03 | 2026-08-15 10:00 | 100.00 | 2026-07-03 |

Study the spreadsheet, then produce a **database schema diagram** of your design in fully normalized form (up to 3NF). The diagram must show **everything**:

- all 3 entities with every column and its MySQL data type,
- primary keys and foreign keys, clearly marked,
- the relationships between the entities and their cardinality (1:N, etc.),
- every constraint that enforces a business rule (`NOT NULL`, `UNIQUE`, `CHECK`) — in particular, it must be visible from the diagram that *a doctor cannot have two appointments at the same date/time*.

Use any tool you like (dbdiagram.io, draw.io) and include it in your repository as `schema-diagram` (image or PDF).

## Part B — Database Implementation & Project Setup

1. **Table creation.** Translate your Part A diagram into a MySQL DDL script, `database/schema.sql`, that creates the database and the 3 tables — data types, primary keys, foreign keys, and every constraint shown on the diagram. The script must run cleanly on a fresh MySQL server. Also provide `database/seed.sql` with realistic sample data: at least 3 patients, 3 doctors (including one with no appointments), and 8 appointments (including one doctor-day at or near the 12-slot daily cap).

2. **Project structure.** Set up the Express project in a **models / controllers / routes** structure:

```
├── database/          schema.sql and seed.sql (Part B.1)
└── src/
    ├── models/        all application SQL lives here — nowhere else
    ├── controllers/   business logic; calls model functions, never the DB directly
    └── routes/        maps URLs and HTTP methods to controllers
```

Every SQL statement in the application must use **parameterized queries** (`?` placeholders via `mysql2`). SQL found in a controller or route file loses marks. **Do not use any ORM for this assignment.**

## Part C — Controllers & Endpoints

Implement endpoints for the operations below. **Designing the API is part of the assessment**: you choose the URL paths, the HTTP methods, and how the endpoints are grouped into controllers and routes — your choices should follow REST conventions and will be marked. The business rules listed are **requirements** — *how* you satisfy them is your design decision, and you will be asked to defend it at the viva.

1. **Basic CRUD** — standard **C**reate, **R**ead (one and all), **U**pdate, and **D**elete operations for patients and for doctors, with sensible validation. (Appointments get their create/delete behaviour from the two operations below — no separate CRUD needed there.)

2. **Book an appointment**. Rules that must always hold:
   - Appointments can only be booked in the future, within working hours (09:00–17:00), on a 30-minute slot boundary.
   - A doctor never exceeds 12 appointments in a day.
   - Two patients can never hold the same doctor slot — even when both requests arrive at the same instant.

3. **Cancel an appointment**. Rules:
   - The refund is computed by the server from the notice given: more than 48 hours → 100%; 24–48 hours → 50%; less than 24 hours → 0%. The response states the refund amount.
   - The cancellation and its refund record succeed or fail together.
   - A cancelled slot becomes bookable by another patient, while the cancellation record is kept for refund history.
   - A cancellation notifies the waitlist (Part E).

4. **Doctor statistics** — for a given doctor: revenue collected, upcoming appointment count, appointments per day for the next 7 days, and utilization % against the 12-slot daily cap.

Operations 5 and 6 are where your **advanced SQL** is assessed: the results must be produced by the SQL in your models (joins, aggregates, etc) — not fetched raw and computed in JavaScript.

5. **Doctors report** — every doctor's total appointments and revenue collected, including doctors with zero appointments.
6. **Busy days report** — every (doctor, date) where more than 80% of the 12-slot daily capacity is booked.

### General requirements (all endpoints)

Input validation with meaningful `400` messages; correct status codes (`201`, `404`, `409`, `422`); a central error-handling middleware.

## Part D — Node.js `fs` Module

**Audit log:** every successful booking and cancellation must be appended as a JSON line to `logs/audit.log` using the `fs` module (async, non-blocking — no `*Sync` calls inside request handlers). The logger must create the `logs/` directory on first run if it doesn't exist, and a logging failure must **not** fail the user's request.

## Part E — Queues & Redis

1. **Waitlist queue:** when the requested slot (or the doctor's whole day) is fully booked, offer the patient a waitlist spot — push them onto a queue (Redis list, or Bull/BullMQ). When a cancellation frees a slot, a **worker process** (separate from the web server) pops the first waitlisted patient and books them in. Think through: what happens if the promoted booking itself fails? The patient must not simply vanish from both the queue and the appointments table.
2. **Notification jobs:** every confirmed appointment enqueues a "confirmation SMS/email" job; the worker processes it by writing the message to the audit log (no real sending needed).

## Part F — Unit Testing

Using Jest, write **at least 6 meaningful unit tests**:

- The refund calculator from Part C.3 — cover all three tiers **and both boundaries** (exactly 24 hours, exactly 48 hours). Boundary behaviour must match your documented policy.
- One validation function of your choice — e.g., the slot-alignment/working-hours check — including at least one edge case (17:00 exactly? 09:15? a malformed date?).

Tests must not require a live MySQL or Redis connection — that's the point of extracting pure functions. `npm test` must run them.

## Part G — i18n & l10n: Course Feedback Page

Create a **simple HTML page** (served by your Express app at `GET /feedback`) containing a short course-feedback form with **exactly 5 essay questions** (each answered in a `<textarea>`):

1. Which topic in this course did you find most challenging, and why?
2. Describe one concept you understood only after the practical assignments. What made it click?
3. How has your approach to designing databases or APIs changed since the start of the trimester?
4. What would you improve about how this course was taught or assessed?
5. How do you plan to apply what you learned in this course going forward?

**i18n/l10n requirement (keep it simple):** the page title, instructions, and all 5 questions must be loaded from locale files (e.g., `locales/en.json` and `locales/fr.json` — English plus one other language of your choice). Visiting `/feedback?lang=fr` shows the translated page; the default is English, and an unsupported `lang` value must fall back to English rather than crash. Display today's date on the page formatted for the active locale (e.g., using `Intl.DateTimeFormat`).

---

## Submission Requirements

- Git repository (with meaningful commit history — a single "final commit" will be questioned) containing:
  - `schema-diagram` (image or PDF), `schema.sql`, and `seed.sql` (as specified in Part B)
  - Application source, worker process, tests, locale files
  - `README.md` with: setup steps, `.env.example`, and the short written justifications requested in Parts C, D, and E
- The app must start with `npm install && npm start` (plus documented MySQL/Redis setup) and tests with `npm test`.
- A short **viva/demo (10 minutes)** walkthrough.

**Automatic penalties:** SQL injection vector anywhere in the app (−15), secrets committed to the repo (−5), app does not start per README instructions (−10), work the student cannot explain in the video (or at a follow-up viva if called) | Academic integrity referral; affected criteria re-scored at Developing or below |


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

Primary keys, foreign keys, `NOT NULL`, `UNIQUE`, and `CHECK` constraints protect data integrity. The visual design is provided in [`Schema_diagram.png`](Schema_diagram.png); the executable definition is in [`database/schema.sql`](database/schema.sql).

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

After a successful promotion, the worker records the promotion and **simulates** an email/SMS confirmation in the audit log. No message is delivered to a real phone number or email address.

**Implementation note:** The current notification utility is invoked after waitlist promotion. A separate durable confirmation-job queue for **every** newly confirmed appointment is a remaining enhancement required for full alignment with Part E.2. The worker should also be subjected to crash/retry tests before production use.

## 10. Unit Tests — Part F

Jest tests cover pure functions without requiring a live MySQL or Redis server:

- Refund amounts at greater than 48 hours, exactly 48 hours, between 24 and 48 hours, exactly 24 hours, and below 24 hours.
- Slot validation for opening and closing times, 30-minute alignment, and past dates.

Run:

```bash
npm test
```

The test files target 12 assertions in total. Verify the latest local run passes before submission.

## 11. Localization — Part G

The `/feedback` route renders a form with text supplied by `locales/en.json` or `locales/fr.json`. The active language controls the title, instructions, questions, and date format. Unknown language values default to English. Each question uses a `<textarea>`.

**Assignment alignment required:** The original assessment requires the five specified **course-feedback** questions, not clinic/patient-satisfaction questions. The locale files must be updated to use those exact English questions and corresponding French translations before this feature can be considered fully compliant.

## 12. Short Technical Justifications — Parts C, D and E

### Part C — REST API, database transactions and reporting

**REST and layers.** Routes map HTTP methods and URLs to controllers; controllers validate inputs and apply business rules; models contain the SQL. This keeps responsibilities separate and supports maintenance. Queries use `mysql2` placeholders rather than concatenating client input into SQL.

**Booking and concurrency.** Future-date and clinic-hour validation happens before booking. A MySQL transaction locks the doctor row before checking the 12-appointment daily cap and inserting a booking, helping serialize competing requests for that doctor. The database-level unique constraint is a second protection against identical active slots.

**Cancellation and refunds.** Refund tiers are calculated from server-side time and stored fees. One transaction saves the cancellation status and refund amount together. Cancelled records remain available for history while their appointment slots can be reused.

**Statistics.** Reports use SQL joins, `COUNT`, `SUM`, `GROUP BY`, and `HAVING` rather than calculating report totals from raw rows in JavaScript. `LEFT JOIN` keeps doctors with zero appointments visible. Capacity utilization is measured against 12 appointments per doctor/day.

### Part D — Asynchronous file audit

The logger uses non-blocking filesystem operations so disk writes do not block request handling. JSON-lines format is simple to append to and inspect. Errors in logging are caught separately to avoid failing an otherwise successful booking or cancellation.

### Part E — Redis queue and worker

Redis lists preserve waiting order without adding tables to the three-entity relational schema. A separate worker handles promotion so the API can respond without performing queue processing inside an HTTP request. Failed bookings remain on the waitlist for retry, and simulated notifications avoid external SMS/email credentials. A dedicated confirmation-job queue is still needed to satisfy the requirement that **every confirmed appointment** enqueue a worker-processed notification.
