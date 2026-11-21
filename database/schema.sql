
CREATE DATABASE IF NOT EXISTS medibook;
USE medibook;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL,
    room VARCHAR(20) NOT NULL,

    CONSTRAINT chk_doctor_fee
        CHECK (consultation_fee >= 0)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_time DATETIME NOT NULL,
    status ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
    fee_paid DECIMAL(10,2) NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    cancelled_at DATETIME NULL,

    active_slot DATETIME GENERATED ALWAYS AS (
        CASE
            WHEN status = 'booked' THEN appointment_time
            ELSE NULL
        END
    ) STORED,

    CONSTRAINT fk_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id),

    CONSTRAINT fk_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(id),

    CONSTRAINT uq_doctor_slot
        UNIQUE (doctor_id, active_slot),

    CONSTRAINT chk_fee_paid
        CHECK (fee_paid >= 0),

    CONSTRAINT chk_refund
        CHECK (refund_amount >= 0 AND refund_amount <= fee_paid)
);
