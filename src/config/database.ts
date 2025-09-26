import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';

// Database connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('Database connection pool closed');
});

process.on('SIGTERM', async () => {
  await pool.end();
  console.log('Database connection pool closed');
});
