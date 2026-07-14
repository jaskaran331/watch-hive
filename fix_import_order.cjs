const fs = require('fs');

const path = 'src/components/MediaCard.jsx';
let code = fs.readFileSync(path, 'utf8');

// Find the import statements
const importRegex = /^import\s+.*?;\s*$/gm;
let imports = [];
let match;
while ((match = importRegex.exec(code)) !== null) {
  imports.push(match[0]);
}

// Remove the imports from the code
for (const imp of imports) {
  code = code.replace(imp, '');
}

// Remove empty lines at the top
code = code.replace(/^\s+/, '');

// Add imports to the top
const finalCode = imports.join('\n') + '\n\n' + code;

fs.writeFileSync(path, finalCode);
console.log("Fixed import order in MediaCard.jsx");
