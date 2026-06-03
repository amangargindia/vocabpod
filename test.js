const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if(key && val.length > 0) process.env[key.trim()] = val.join('=').trim().replace(/(^'|'$|^\"|\"$)/g, '');
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('words').select('word, custom_svg, svg_elements, stickman_pose, audio_url').in('word', ['Hyperbole', 'Terrific', 'Recuperate', 'Vehement', 'Ecstasy']);
  console.log(JSON.stringify(data, null, 2));
}
run();
