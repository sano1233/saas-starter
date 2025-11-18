import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

let clientInstance: ReturnType<typeof postgres> | undefined;
let dbInstance: ReturnType<typeof drizzle> | undefined;

/**
 * Obtain the singleton PostgreSQL client, creating it on first access.
 *
 * @returns The PostgreSQL client instance
 * @throws If the `POSTGRES_URL` environment variable is not set
 */
function getClient() {
  if (!clientInstance) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    clientInstance = postgres(process.env.POSTGRES_URL);
  }
  return clientInstance;
}

/**
 * Get the singleton drizzle-wrapped database instance.
 *
 * Initializes the instance on first call and returns the cached instance on subsequent calls.
 *
 * @returns The drizzle ORM database instance
 */
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
    return typeof value === 'function' ? value.bind(actualClient) : value;
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const actualDb = getDb();
    const value = actualDb[prop as keyof typeof actualDb];
    return typeof value === 'function' ? value.bind(actualDb) : value;
  }
});