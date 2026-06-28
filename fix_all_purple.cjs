const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // JSX and CSS replacements
      if (content.includes('var(--accent)')) {
        content = content.replace(/var\(--accent\)/g, 'var(--red)');
        changed = true;
      }
      if (content.includes('var(--accent-glow)')) {
        content = content.replace(/var\(--accent-glow\)/g, 'var(--red-glow)');
        changed = true;
      }
      if (content.includes('var(--accent-dim)')) {
        content = content.replace(/var\(--accent-dim\)/g, 'var(--red-dim)');
        changed = true;
      }

      // Special handling for appearance.js
      if (fullPath.endsWith('appearance.js')) {
        content = content.replace(/#a855f7/gi, '#F5C518');
        content = content.replace(/#c084fc/gi, '#FFD700');
        content = content.replace(/rgba\(168,85,247/g, 'rgba(245, 197, 24');
        
        content = content.replace(/#7c3aed/gi, '#F5C518');
        content = content.replace(/#8b5cf6/gi, '#FFD700');
        content = content.replace(/rgba\(124,58,237/g, 'rgba(245, 197, 24');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));

console.log("Replaced all accents and appearance references.");
