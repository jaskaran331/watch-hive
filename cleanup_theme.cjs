const fs = require('fs');

// 1. Fix global.css
let css = fs.readFileSync('src/styles/global.css', 'utf8');

// Replace CSS variables
css = css.replace(/var\(--primary\)/g, 'var(--red)');
css = css.replace(/var\(--primary-dim\)/g, 'var(--red-dim)');
css = css.replace(/var\(--accent\)/g, 'var(--red)');
css = css.replace(/var\(--accent-dim\)/g, 'var(--red-dim)');

// Replace hardcoded purple RGB with golden RGB
css = css.replace(/139,\s*92,\s*246/g, '245, 197, 24');

// Replace hardcoded purple hex colors with golden hex
css = css.replace(/#a855f7/gi, '#F5C518');
css = css.replace(/#a78bfa/gi, '#F5C518');

// Fix stretched poster
const posterRegex = /\.detail-poster\s*\{([^}]*)\}/;
if (posterRegex.test(css)) {
  css = css.replace(
    posterRegex,
    (match, inner) => {
      if (!inner.includes('align-self')) {
        return `.detail-poster {${inner}\n    align-self: flex-start;\n    aspect-ratio: 2 / 3;\n}`;
      }
      return match;
    }
  );
}

fs.writeFileSync('src/styles/global.css', css);

// 2. Fix Sidebar.jsx logo
let sidebarJsx = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
sidebarJsx = sidebarJsx.replace(/\/logo\.jpg/g, '/logo.png');
fs.writeFileSync('src/components/Sidebar.jsx', sidebarJsx);

// 3. Fix TVPage / MoviePage if there are any purple specific classes, but mostly it's global.css
console.log("Cleanup script completed successfully.");
