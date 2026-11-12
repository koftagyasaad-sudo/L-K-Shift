
declare global {
  var globalNeonPool: unknown | undefined;
}
import { neon } from "@neondatabase/serverless";

export function getSqlRows<T extends Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result.filter(isRecord) as T[];
  if (isRecord(result) && Array.isArray(result.rows)) {
    return result.rows.filter(isRecord) as T[];
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    console.warn("DATABASE_URL not set. Returning empty query result for build safety.");
    return { rows: [], rowCount: 0 };
  }

  try {
    const sql = neon(connectionString);
    const result: unknown = await sql(text, params);
    const rows = getSqlRows<T>(result);
    return { rows, rowCount: rows.length };
  } catch (error) {
    console.error("Database Query Error:", error);
    throw new Error(error instanceof Error ? error.message : "فشل تنفيذ الاستعلام في قاعدة البيانات");
  }
}
