/**
 * Run this script to create all Zypflow database tables.
 * Usage: npx tsx scripts/run-migration.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
});

async function runMigration() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migration_001_full_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Running ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        // Try via raw POST if rpc doesn't work
        console.log(`  [${i + 1}] ${preview}... (rpc failed: ${error.message})`);
      } else {
        console.log(`  [${i + 1}] ${preview}... OK`);
      }
    } catch (e) {
      console.log(`  [${i + 1}] ${preview}... SKIPPED (${e})`);
    }
  }

  console.log('\nDone! Go to Supabase Table Editor to verify tables exist.');
}

runMigration().catch(console.error);
