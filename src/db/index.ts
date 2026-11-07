import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// منع استدعاء قاعدة البيانات من طرف المتصفح لحماية الأمان
if (typeof window !== 'undefined') {
  throw new Error('Security Alert: Database cannot be accessed from the client-side.');
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables.');
}

// إنشاء اتصال آمن وسريع عبر HTTP متوافق مع خوادم Vercel Edge و Serverless
const sqlClient = neon(connectionString);

export const db = drizzle(sqlClient, { schema });
export default db;
