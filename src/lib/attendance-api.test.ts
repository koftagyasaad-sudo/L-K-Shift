import { describe, expect, it } from "vitest";
import { parseAttendanceInput, submitAttendance } from "./attendance-api";
import type { ApiPrincipal } from "./api-auth";

const validPhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rS8AAAAASUVORK5CYII=";

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
      userId: "user-8",
      branchId: "branch-3",
      timestamp: "2026-11-09T08:00:00.000Z",
      accuracy: 18.5,
      photoBase64: validPhoto,
    }));

    expect(input).toMatchObject({
      action: "CHECK_IN",
      latitude: 30.0444,
      longitude: 31.2357,
      userId: "user-8",
      branchId: "branch-3",
      accuracy: 18.5,
    });
    expect(input.timestamp.toISOString()).toBe("2026-11-09T08:00:00.000Z");
  });

  it("rejects invalid GPS accuracy while accepting valid indoor readings", async () => {
    const valid = await parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: -33.8688,
      longitude: 151.2093,
      accuracy: 45,
      recordedAt: "2026-11-09T08:00:00.000Z",
      photoBase64: validPhoto,
    }));
    expect(valid.accuracy).toBe(45);
    expect(valid.timestamp.toISOString()).toBe("2026-11-09T08:00:00.000Z");

    await expect(parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: 30,
      longitude: 31,
      accuracy: 0,
    }))).rejects.toThrow("دقة إشارة GPS غير صالحة.");
    await expect(parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: 30,
      longitude: 31,
      accuracy: "not-a-number",
    }))).rejects.toThrow("دقة إشارة GPS غير صالحة.");
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
      photoBase64: validPhoto,
    }))).rejects.toThrow("تاريخ الحركة غير صالح.");
  });

  it("requires a valid image payload for every attendance action", async () => {
    await expect(parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: 30,
      longitude: 31,
    }))).rejects.toThrow("صورة الحضور مطلوبة لإتمام العملية.");

    await expect(parseAttendanceInput(request({
      action: "CHECK_IN",
      latitude: 30,
      longitude: 31,
      photoBase64: "data:image/png;base64,not-an-image",
    }))).rejects.toThrow("صورة الحضور غير صالحة.");
  });

  it("prevents employees from overriding attendance ownership even with override permission", async () => {
    const principal: ApiPrincipal = {
      id: "employee-1",
      systemRole: "EMPLOYEE",
      jobRole: "EMPLOYEE",
      primaryBranchId: null,
      branchScope: "OWN_BRANCH",
      allowedBranchIds: [],
      permissions: ["attendance.override"],
    };

    const response = await submitAttendance(principal, {
      action: "CHECK_IN",
      latitude: 30,
      longitude: 31,
      accuracy: null,
      photoUrl: validPhoto,
      userId: "employee-2",
      branchId: null,
      timestamp: new Date("2026-11-09T08:00:00.000Z"),
    });

    expect(response.status).toBe(403);
  });
});
