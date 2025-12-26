import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Note: Connection string should be in .env
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/zapia_ai';

// Disable prefetch as it is not supported for "Transaction" mode in pgbouncer if used, 
// and generally safer for multi-tenant switching context
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);
