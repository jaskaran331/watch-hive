const fs = require('fs');
let css = fs.readFileSync('src/styles/global.css', 'utf8');

css += `
.site-footer {
    background: var(--bg-elevated);
    padding: 32px 24px;
    margin-top: 64px;
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex;
    justify-content: center;
}
.footer-content {
    max-width: 800px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}
.footer-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 800;
    font-family: var(--font-display);
    color: var(--text);
    text-decoration: none;
}
.footer-logo svg {
    width: 24px;
    height: 24px;
    color: var(--accent);
}
.footer-disclaimer {
    font-size: 13px;
    color: var(--text3);
    line-height: 1.5;
}
`;

fs.writeFileSync('src/styles/global.css', css);

let appJsx = fs.readFileSync('src/App.jsx', 'utf8');
if (!appJsx.includes('import Footer')) {
  appJsx = appJsx.replace(
    'import SearchModal from "./components/SearchModal";',
    'import SearchModal from "./components/SearchModal";\nimport Footer from "./components/Footer";'
  );
  
  // Find where to insert <Footer />. Usually inside <div className="page-content"> or at the bottom of the main layout.
  // The structure is usually <div className="app-container"> -> <main> -> pages
  // Let's insert it before </main> or at the very end of app-container
  appJsx = appJsx.replace(
    /<\/div>\s*<\/Router>/,
    `  <Footer />\n      </div>\n    </Router>`
  );
  
  fs.writeFileSync('src/App.jsx', appJsx);
}
