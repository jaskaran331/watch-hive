const fs = require('fs');

let jsx = fs.readFileSync('src/App.jsx', 'utf8');

if (!jsx.includes('import Footer')) {
  jsx = jsx.replace(
    /import React[\s\S]*?;/,
    match => `${match}\nimport Footer from "./components/Footer";`
  );
}

if (!jsx.includes('<Footer />')) {
  jsx = jsx.replace(
    /<\/Suspense>\s*<\/div>/,
    `</Suspense>\n          <Footer />\n        </div>`
  );
}

fs.writeFileSync('src/App.jsx', jsx);
