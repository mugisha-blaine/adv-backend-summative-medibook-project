
const validateSlot = require("../src/utils/validateSlot");

const now = new Date("2026-11-21T10:00:00+02:00");

describe("Appointment slot validation", () => {
    test("accepts a valid morning slot", () => {
        expect(validateSlot("2026-12-10 09:00:00", now)).toBeNull();
    });

    test("accepts the last valid slot at 16:30", () => {
        expect(validateSlot("2026-12-10 16:30:00", now)).toBeNull();
    });

    test("rejects a slot before opening hours", () => {
        expect(validateSlot("2026-12-10 08:30:00", now)).not.toBeNull();
    });

    test("rejects a slot at closing time", () => {
        expect(validateSlot("2026-12-10 17:00:00", now)).not.toBeNull();
    });

    test("rejects invalid 30-minute boundaries", () => {
        expect(validateSlot("2026-12-10 10:15:00", now)).not.toBeNull();
    });

    test("rejects an appointment in the past", () => {
        expect(validateSlot("2026-10-10 10:00:00", now)).not.toBeNull();
    });
});
