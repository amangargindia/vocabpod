const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

walk('src/app').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('Sidebar') && !f.includes('layout.tsx') && !f.includes('admin')) {
    c = c.replace(/import Sidebar from ["']@\/components\/Sidebar["'];?\n?/g, '');
    c = c.replace(/\s*<Sidebar \/>\s*\n?/g, '\n');
    fs.writeFileSync(f, c);
  }
});
