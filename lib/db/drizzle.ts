import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let clientInstance: ReturnType<typeof postgres> | undefined;
let dbInstance: DbInstance | undefined;

function getClient() {
  if (!clientInstance) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    clientInstance = postgres(process.env.POSTGRES_URL);
  }
  return clientInstance;
}

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
  }
  return dbInstance;
}

// Lazy initialization using Proxy to maintain backward compatibility
// The database connection is only created when actually accessed at runtime
export const client = new Proxy({} as ReturnType<typeof postgres>, {
  get: (_, prop) => {
    const actualClient = getClient();
    const value = actualClient[prop as keyof typeof actualClient];
    if (typeof value === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).bind(actualClient);
    }
    return value;
  }
});

export const db = new Proxy({} as DbInstance, {
  get: (_, prop) => {
    const actualDb = getDb();
    const value = actualDb[prop as keyof typeof actualDb];
    if (typeof value === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).bind(actualDb);
    }
    return value;
  }
});
