const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/Neha Fathima/OneDrive/Desktop/CivicTrackGuard/frontend/src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  // Replace '/api/ with '/
  content = content.replace(/'\/api\//g, "'/");
  // Replace `/api/ with `/
  content = content.replace(/`\/api\//g, "`/");
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    changedCount++;
  }
});

console.log('Total files updated:', changedCount);
