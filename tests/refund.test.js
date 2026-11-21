
const calculateRefund = require("../src/utils/calculateRefund");

const fee = 20000;
const now = Date.parse("2026-11-21T10:00:00+02:00");

const appointmentAfter = (hours) => {
    const date = new Date(now + hours * 3600000 + 2 * 3600000);
    return date.toISOString().slice(0, 19).replace("T", " ");
};

describe("Refund calculations", () => {
    test("100% refund when more than 48 hours remain", () => {
        expect(calculateRefund(appointmentAfter(72), fee, now)).toBe(20000);
    });

    test("100% refund just above 48 hours", () => {
        expect(calculateRefund(appointmentAfter(48.5), fee, now)).toBe(20000);
    });

    test("50% refund at exactly 48 hours", () => {
        expect(calculateRefund(appointmentAfter(48), fee, now)).toBe(10000);
    });

    test("50% refund between 24 and 48 hours", () => {
        expect(calculateRefund(appointmentAfter(36), fee, now)).toBe(10000);
    });

    test("50% refund at exactly 24 hours", () => {
        expect(calculateRefund(appointmentAfter(24), fee, now)).toBe(10000);
    });

    test("0% refund below 24 hours", () => {
        expect(calculateRefund(appointmentAfter(12), fee, now)).toBe(0);
    });
});
