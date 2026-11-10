import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration helper to read and provide the initial SQL schema.
 */
export function getInitialSchemaSQL() {
  const schemaPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  return fs.readFileSync(schemaPath, 'utf-8');
}

export async function runMigrations() {
  console.log('--- Database Migration Runner ---');
  const sql = getInitialSchemaSQL();
  console.log(`Loaded migration SQL (bytes: ${sql.length})`);

  if (!config.supabase.databaseUrl && !config.supabase.url) {
    console.warn('Notice: DATABASE_URL / SUPABASE_URL not configured. Copy server/.env.example to .env with valid credentials.');
    return { success: false, reason: 'Credentials not configured' };
  }

  console.log('Migration scripts ready for execution in Supabase SQL editor or direct Postgres connection.');
  return { success: true, sqlLength: sql.length };
}

// Execute directly if run as main
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => process.exit(0)).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

export default runMigrations;
