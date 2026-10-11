import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
