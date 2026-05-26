const fs = require('fs');
let c = fs.readFileSync('src/app/HomeClient.tsx', 'utf8');

// Remove dictionary props
c = c.replace(/dict: any;\s*/g, '');
c = c.replace(/lang: string;\s*/g, '');
c = c.replace(/dict,\s*/g, '');
c = c.replace(/lang,\s*/g, '');

// Clean up links and ternary statements
c = c.replace(/lang === "hi" \? "[^"]+" : ("[^"]+")/g, '$1');
c = c.replace(/`\/\$\{lang\}\/([^`]+)`/g, '`/$1`');
c = c.replace(/`\/\$\{lang\}`/g, '`/`');
c = c.replace(/href=\{`\/\$\{lang\}\/([^\}]+)\}/g, 'href={`/$1}');

// Replace dict lookups with an inline object
const dict = {
  dueForReview: 'Due for Review',
  word: 'word',
  words: 'words',
  todaysWords: "Today's Words",
  dailyCtaSub: 'Master these and secure your streak.',
  startDailyWord: 'Start Daily Word',
  dailyComplete: 'Daily Goal Complete',
  consistencyHeader: 'Consistency beats cramming.',
  consistencyText: 'The system remembers when you struggle and spaces out your reviews precisely to maximize retention.',
  consistentYou: 'You (Consistent)',
  wordsMastered: 'Words Mastered',
  crammerTitle: 'The Crammer',
  wordsRetained: 'Words Retained',
  retentionTitle: 'Memory Retention',
  pillRetention: '+300% Retention',
  pillTime: '15m / day',
  pillTomorrow: 'Come back tomorrow',
  flashcards: 'Flashcards',
  autoplay: 'Autoplay',
  unlockPotentialTitle: "Unlock Your Memory's Potential",
  unlockPotentialText: 'Upgrade to Vocabpod Premium to master infinite words, enable background autoplay, and access advanced memory tools.',
  upgradeBtn: 'Upgrade to Premium',
  filterAll: 'All',
  noLessons: 'No lessons available yet.',
  allWords: 'All Words'
};

c = c.replace(/dict\.([a-zA-Z]+)/g, 'enDict.$1');
c = c.replace('const feed = initialFeed || [];', 'const enDict = ' + JSON.stringify(dict) + ';\n  const feed = initialFeed || [];');

fs.writeFileSync('src/app/HomeClient.tsx', c);
