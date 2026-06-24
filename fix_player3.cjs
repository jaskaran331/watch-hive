const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace did-finish-load listeners
  content = content.replace(/wv\.addEventListener\(" did-finish-load\\, done\);/g, 'wv.onload = done; wv.onerror = done;');
 content = content.replace(/wv\.addEventListener\(\did-fail-load\\, done\);/g, '');
 content = content.replace(/wv\.removeEventListener\(\did-finish-load\\, done\);/g, '');
 content = content.replace(/wv\.removeEventListener\(\did-fail-load\\, done\);/g, '');

 // Add onLoad directly to iframe and remove the ref if we want, but it's easier to just add onLoad
 content = content.replace(/<iframe allowFullScreen/g, '<iframe allowFullScreen onLoad={() => setWebviewLoading(false)}');

 fs.writeFileSync(file, content, 'utf8');
 console.log('Fixed', file);
}

fixFile('src/pages/MoviePage.jsx');
fixFile('src/pages/TVPage.jsx');
