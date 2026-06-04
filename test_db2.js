const https = require('https');

const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/words?word=eq.Vehement&select=quiz_questions');
const options = {
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)[0].quiz_questions[0]));
});
