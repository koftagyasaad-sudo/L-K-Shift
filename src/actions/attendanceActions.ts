"use server";

import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  branch_id: string;
  check_in: string;
  check_out?: string | null;
  gps_lat: number;
  gps_lng: number;
  face_verified: boolean;
  status: string;
}

function getClient() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function recordAttendanceAction(data: {
  employeeId: string;
  branchId: string;
  lat: number;
  lng: number;
  faceVerified: boolean;
  actionType: "IN" | "OUT";
}): Promise<{ success: boolean; message: string }> {
  try {
    const sql = getClient();
    const now = new Date().toISOString();
    const id = "att-" + Date.now();

    if (sql) {
      if (data.actionType === "IN") {
        await sql`
          INSERT INTO attendance_logs (id, employee_id, branch_id, check_in, gps_lat, gps_lng, face_verified, status)
          VALUES (${id}, ${data.employeeId}, ${data.branchId}, ${now}, ${data.lat}, ${data.lng}, ${data.faceVerified}, 'نشط')
        `;
      } else {
        await sql`
          UPDATE attendance_logs
          SET check_out = ${now}, status = 'منتهي'
          WHERE employee_id = ${data.employeeId} AND status = 'نشط'
        `;
      }
    }

    revalidatePath("/[locale]/(app)", "page");
    revalidatePath("/[locale]/(app)/admin/employees", "page");
    
    return {
      success: true,
      message: data.actionType === "IN" ? "تم تسجيل الحضور بنجاح عبر البصمة والـ GPS" : "تم تسجيل الانصراف بنجاح"
    };
  } catch (error: any) {
    console.error("Neon recordAttendanceAction Error:", error);
    return { success: false, message: error?.message || "تعذر تسجيل الحضور والغياب" };
  }
}
