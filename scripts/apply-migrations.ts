import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filename: string) {
  try {
    const sql = readFileSync(join(__dirname, `../supabase/migrations/${filename}`), 'utf8');
    console.log(`Applying migration: ${filename}`);
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error applying ${filename}:`, error);
    } else {
      console.log(`✅ Applied: ${filename}`);
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
}

async function applyAllMigrations() {
  const migrations = [
    '0001_enable_extensions_and_enums.sql',
    '0002_create_lookup_tables.sql',
    '0003_create_users_table.sql',
    '0004_expand_profiles_table.sql',
    '0005_create_role_extension_tables.sql',
    '0006_create_social_graph.sql',
    '0012_add_helper_functions.sql',
    '0013_enable_rls_and_base_policies.sql',
    '0014_add_privacy_policies.sql',
    '0015_add_constraints_and_uniqueness.sql'
  ];

  for (const migration of migrations) {
    await applyMigration(migration);
  }
}

applyAllMigrations();
