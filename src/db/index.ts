import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// منع استدعاء قاعدة البيانات من طرف المتصفح لحماية الأمان
if (typeof window !== 'undefined') {
  throw new Error('Security Alert: Database cannot be accessed from the client-side.');
}

function createDatabase() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  return drizzle(neon(connectionString), { schema });
}

type Database = ReturnType<typeof createDatabase>;
let database: Database | undefined;

function getDatabase(): Database {
  database ??= createDatabase();
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const databaseInstance = getDatabase();
    const value = Reflect.get(databaseInstance, property, databaseInstance);
    return typeof value === 'function' ? value.bind(databaseInstance) : value;
  },
});

export default db;
