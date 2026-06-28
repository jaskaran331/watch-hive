const fs = require('fs');

let css = fs.readFileSync('src/styles/global.css', 'utf8');

// Replace leftover purple drop shadows
css = css.replace(/168,\s*85,\s*247/g, '245, 197, 24');

fs.writeFileSync('src/styles/global.css', css);
