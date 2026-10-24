import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// قراءة المتغيرات البيئية لضمان وصول Drizzle لقاعدة البيانات
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
