const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const dotenv = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim().replace(/(^'|'$|^\"|\"$)/g, '');
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const sql = `ALTER TABLE sales_config ADD COLUMN IF NOT EXISTS preview_words_data JSONB DEFAULT '[]'::jsonb;`;
  
  console.log("Applying migration via RPC...");
  // Use RPC if available, or just fetch directly if not. 
  // Wait, Supabase js client doesn't expose a raw query executor unless you have a specific RPC like 'exec_sql'.
  // If not, I can just use postgres connection or a workaround.
}

run();
