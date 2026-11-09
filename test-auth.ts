import { db } from "./src/db";
import { sql } from "drizzle-orm";
import { verifyPassword } from "./src/lib/passwords";
import { authOptions } from "./src/lib/auth";

async function run() {
  console.log("=== 1. DATABASE RECORD ===");
  const res: any = await db.execute(sql`
    SELECT id, name, phone, role_id, branch_id, is_active, password_hash 
    FROM users 
    WHERE phone = '01068390982'
  `);
  const rows = res.rows || res;
  const user = rows[0];
  console.log("User in DB:", user ? { 
    id: user.id, 
    name: user.name, 
    phone: user.phone, 
    role_id: user.role_id, 
    branch_id: user.branch_id, 
    is_active: user.is_active, 
    hash_prefix: user.password_hash?.substring(0, 15) 
  } : "NOT FOUND");

  if (!user) {
    console.log("ERROR: User not found in database connected to Codespaces!");
    return;
  }

  console.log("\n=== 2. PASSWORD VERIFICATION ===");
  const v = await verifyPassword("16932@@Omar", user.password_hash);
  console.log("Password Verification:", v);

  console.log("\n=== 3. AUTHORIZE FUNCTION TEST ===");
  const provider: any = authOptions.providers.find((p: any) => p.id === "credentials");
  if (!provider) {
    console.log("Credentials provider not found");
    return;
  }

  const resPhone = await provider.authorize({ phone: "01068390982", password: "16932@@Omar" }, {} as any);
  console.log("Result with { phone }:", resPhone ? "SUCCESS" : "FAILED (Returned null)");

  const resUser = await provider.authorize({ username: "01068390982", password: "16932@@Omar" }, {} as any);
  console.log("Result with { username }:", resUser ? "SUCCESS" : "FAILED (Returned null)");
}

run().catch(console.error).finally(() => process.exit(0));
