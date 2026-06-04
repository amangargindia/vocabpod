const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('words').select('quiz_questions').eq('word', 'Vehement').single();
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
main();
