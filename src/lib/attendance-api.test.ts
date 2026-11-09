import { describe, expect, it } from "vitest";
import { parseAttendanceInput } from "./attendance-api";

function request(body: unknown): Request {
  return new Request("http://localhost/api/attendance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseAttendanceInput", () => {
  it("parses a valid check-in request with validated coordinates", async () => {
    const input = await parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: 30.0444,
      longitude: 31.2357,
      userId: 8,
      branchId: 3,
      timestamp: "2026-11-09T08:00:00.000Z",
    }));

    expect(input).toMatchObject({
      action: "CHECK_IN",
      latitude: 30.0444,
      longitude: 31.2357,
      userId: 8,
      branchId: 3,
    });
    expect(input.timestamp.toISOString()).toBe("2026-11-09T08:00:00.000Z");
  });

  it("rejects requests with missing coordinates instead of treating them as zero", async () => {
    await expect(parseAttendanceInput(request({ action: "CHECK_IN" })))
      .rejects.toThrow("إحداثيات الموقع غير صالحة.");
  });

  it("rejects coordinates outside valid latitude and longitude ranges", async () => {
    await expect(parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: 91,
      longitude: 31,
    }))).rejects.toThrow("إحداثيات الموقع غير صالحة.");
  });

  it("rejects unsupported actions and malformed timestamps", async () => {
    await expect(parseAttendanceInput(request({
      action: "DELETE",
      latitude: 30,
      longitude: 31,
    }))).rejects.toThrow("نوع الحركة غير صالح.");

    await expect(parseAttendanceInput(request({
      action: "CHECK_OUT",
      latitude: 30,
      longitude: 31,
      timestamp: "not-a-time",
    }))).rejects.toThrow("تاريخ الحركة غير صالح.");
  });
});
