
USE medibook;

-- Patients
INSERT INTO patients (id, name, email, phone) VALUES
(1, 'Alice Uwase', 'alice@example.com', '0788111001'),
(2, 'Eric Mugisha', 'eric@example.com', '0788111002'),
(3, 'Diane Mukamana', 'diane@example.com', '0788111003'),
(4, 'Patrick Niyonzima', 'patrick@example.com', '0788111004'),
(5, 'Grace Uwera', 'grace@example.com', '0788111005');

-- Doctors
INSERT INTO doctors (id, name, specialty, consultation_fee, room) VALUES
(1, 'Dr. Jean Habimana', 'General Medicine', 15000, 'R-101'),
(2, 'Dr. Aline Mukeshimana', 'Paediatrics', 20000, 'R-102'),
(3, 'Dr. Claude Nkurunziza', 'Dermatology', 25000, 'R-103');

-- Appointments
-- Doctor 1 has 11 bookings on the same day (near the limit of 12)
INSERT INTO appointments
(patient_id, doctor_id, appointment_time, status, fee_paid) VALUES
(1, 1, '2026-12-03 09:00:00', 'booked', 15000),
(2, 1, '2026-12-03 09:30:00', 'booked', 15000),
(3, 1, '2026-12-03 10:00:00', 'booked', 15000),
(4, 1, '2026-12-03 10:30:00', 'booked', 15000),
(5, 1, '2026-12-03 11:00:00', 'booked', 15000),
(1, 1, '2026-12-03 11:30:00', 'booked', 15000),
(2, 1, '2026-12-03 12:00:00', 'booked', 15000),
(3, 1, '2026-12-03 12:30:00', 'booked', 15000),
(4, 1, '2026-12-03 13:00:00', 'booked', 15000),
(5, 1, '2026-12-03 13:30:00', 'booked', 15000),
(1, 1, '2026-12-03 14:00:00', 'booked', 15000),

-- Doctor 2 has 2 bookings
(2, 2, '2026-12-04 10:00:00', 'booked', 20000),
(3, 2, '2026-12-04 10:30:00', 'booked', 20000);

-- Doctor 3 has no appointments
