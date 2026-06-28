const fs = require('fs');

function replaceLogo(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/<PlayIcon\s*\/>/g, '<img src="/logo.png" alt="watch-hive logo" style={{width: 28, height: 28, borderRadius: 4}} />');
  fs.writeFileSync(filePath, content);
}

replaceLogo('src/components/Sidebar.jsx');
replaceLogo('src/components/MobileNav.jsx');
replaceLogo('src/components/Footer.jsx');
