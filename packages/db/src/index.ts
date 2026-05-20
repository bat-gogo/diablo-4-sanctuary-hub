import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export * from './schema';
export { schema };

neonConfig.fetchConnectionCache = true;

let _db: ReturnType<typeof createDbClient> | undefined;

function createDbClient(url: string) {
  const sql = neon(url);
  return drizzle(sql, { schema });
}

/**
 * Lazily-initialized singleton db client. Reads DATABASE_URL on first call so
 * importing this module in build-time contexts (e.g. drizzle-kit) does not
 * require the env var to be present.
 */
export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  _db = createDbClient(url);
  return _db;
}

export type Db = ReturnType<typeof getDb>;
