require("dotenv").config();

const redis = require("./src/config/redis");
const Appointment = require("./src/models/appointmentModel");
const auditLogger = require("./src/utils/auditLogger");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processWaitlist(key) {
    const lockKey = `lock:${key}`;
    const token = `${process.pid}-${Date.now()}-${Math.random()}`;

    const locked = await redis.set(lockKey, token, {
        NX: true,
        EX: 60
    });

    if (!locked) return;

    try {
        const first = await redis.lIndex(key, 0);
        if (!first) return;

        const { patient_id, doctor_id, appointment_time } = JSON.parse(first);

        const appointmentDate = new Date(
            appointment_time.replace(" ", "T") + "+02:00"
        );

        if (appointmentDate <= new Date()) {
            await redis.lPop(key);
            return;
        }

        const alreadyBooked = await Appointment.hasBooking(
            patient_id, doctor_id, appointment_time
        );

        if (alreadyBooked) {
            await redis.lPop(key);
            return;
        }

        const unavailable = await Appointment.isUnavailable(
            doctor_id, appointment_time
        );

        if (unavailable) return;

        const booking = await Appointment.create(
            patient_id, doctor_id, appointment_time
        );

        await redis.lPop(key);

        console.log(`Promoted patient ${patient_id} to appointment ${booking.id}`);

        void auditLogger("WAITLIST_PROMOTED", {
            appointment_id: booking.id,
            patient_id,
            doctor_id,
            appointment_time
        });
    } catch (error) {
        console.error("Waitlist promotion failed:", error.message);
        // Keep the patient in Redis so promotion can be retried.
    } finally {
        await redis.eval(
            `if redis.call("GET", KEYS[1]) == ARGV[1] then
         return redis.call("DEL", KEYS[1])
       end
       return 0`,
            { keys: [lockKey], arguments: [token] }
        );
    }
}

async function startWorker() {
    while (!redis.isReady) {
        await sleep(1000);
    }

    console.log("MediBook waitlist worker running");

    while (true) {
        try {
            for await (const batch of redis.scanIterator({
                MATCH: "waitlist:*",
                COUNT: 100
            })) {
                const keys = Array.isArray(batch) ? batch : [batch];

                for (const key of keys) {
                    await processWaitlist(key);
                }
            }
        } catch (error) {
            console.error("Worker error:", error.message);
        }

        await sleep(3000);
    }
}

startWorker().catch(console.error);