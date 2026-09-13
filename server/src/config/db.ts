import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse PostgreSQL DATE (OID 1082) as plain string 'YYYY-MM-DD' instead of JavaScript Date object in local time
types.setTypeParser(1082, (val: string) => val);

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'admin',
  database: process.env.PGDATABASE || 'vacayvault',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export default pool;
