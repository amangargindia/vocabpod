const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env.local
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^'|'$|^\"|\"$)/g, '');
      if (key) process.env[key] = val;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Check in public.words table
  const { data: wordData, error: wordErr } = await supabase
    .from('words')
    .select('*')
    .eq('word', 'hyperbole');
    
  console.log("--- Dictionary (words table) ---");
  if (wordErr) {
    console.error("Error fetching from words table:", wordErr);
  } else {
    console.log("Found in words table:", wordData.length);
    if (wordData.length > 0) {
      console.log("Word details:", JSON.stringify(wordData[0], null, 2));
    }
  }

  // Check in sales_config table
  const { data: salesData, error: salesErr } = await supabase
    .from('sales_config')
    .select('preview_words_data')
    .eq('id', 1)
    .single();

  console.log("\n--- Sales Config preview_words_data ---");
  if (salesErr) {
    console.error("Error fetching sales config:", salesErr);
  } else {
    const words = salesData.preview_words_data || [];
    console.log("Total words in sales config:", words.length);
    const hyperboleWord = words.find(w => w.word.toLowerCase() === 'hyperbole');
    if (hyperboleWord) {
      console.log("Hyperbole in sales config:", JSON.stringify(hyperboleWord, null, 2));
    } else {
      console.log("Hyperbole NOT found in sales config words list.");
    }
  }
}

run();
