import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// تحسين أداء الاتصال في بيئة Vercel Edge/Serverless
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// استخدام HTTP لضمان عدم استنفاد اتصالات قاعدة البيانات (Connection Exhaustion)
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
