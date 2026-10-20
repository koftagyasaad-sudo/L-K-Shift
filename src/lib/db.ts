import { neon } from "@neondatabase/serverless";

export async function query(
  text: string,
  params: any[] = []
): Promise<{ rows: any[]; rowCount: number }> {
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
    const result = (await sql(text, params)) as any[];
    const rows = Array.isArray(result) ? result : [];
    return { rows, rowCount: rows.length };
  } catch (error: any) {
    console.error("Database Query Error:", error);
    throw new Error(error.message || "فشل تنفيذ الاستعلام في قاعدة البيانات");
  }
}
