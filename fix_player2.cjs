const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace <webview> with <iframe>
  content = content.replace(/<webview/g, '<iframe allowFullScreen');
  content = content.replace(/<\/webview>/g, '</iframe>');

  // Fix webview load events
  content = content.replace(/wv\.addEventListener\(" did-finish-load\\, done\);/g, 'wv.onload = done; wv.onerror = done;');
 content = content.replace(/wv\.addEventListener\(\did-fail-load\\, done\);/g, '');
 content = content.replace(/wv\.removeEventListener\(\did-finish-load\\, done\);/g, '');
 content = content.replace(/wv\.removeEventListener\(\did-fail-load\\, done\);/g, '');

 // Disable pip and fullscreen IPC - use single line regex since they are single lines usually or just simple strings
 content = content.replace(/const enterH = window\.electron\?\.onWebviewEnterFullscreen\?\.[\s\S]*?\}\);/g, 'const enterH = null;');
 content = content.replace(/const leaveH = window\.electron\?\.onWebviewLeaveFullscreen\?\.[\s\S]*?\}\);/g, 'const leaveH = null;');
 content = content.replace(/if \(enterH\) window\.electron\?\.offWebviewEnterFullscreen\?\.\(enterH\);/g, '');
 content = content.replace(/if \(leaveH\) window\.electron\?\.offWebviewLeaveFullscreen\?\.\(leaveH\);/g, '');

 content = content.replace(/const openH = window\.electron\?\.onPipOpened\?\.[\s\S]*?\}\);/g, 'const openH = null;');
 content = content.replace(/const closeH = window\.electron\?\.onPipClosed\?\.[\s\S]*?\}\);/g, 'const closeH = null;');
 content = content.replace(/if \(openH\) window\.electron\?\.offPipOpened\?\.\(openH\);/g, '');
 content = content.replace(/if \(closeH\) window\.electron\?\.offPipClosed\?\.\(closeH\);/g, '');

 content = content.replace(/window\.electron\?\.queryVideoProgress/g, 'false');
 content = content.replace(/wv\.executeJavaScript/g, 'Promise.reject().catch');
 content = content.replace(/wv\.getWebContentsId\(\)/g, 'null');

 content = content.replace(/window\.electron\?\.openPipWindow\?\([^)]+\)/g, 'null');
 content = content.replace(/window\.electron\?\.closePipWindow\?\(\)/g, 'null');

 fs.writeFileSync(file, content, 'utf8');
 console.log('Fixed', file);
}

fixFile('src/pages/MoviePage.jsx');
fixFile('src/pages/TVPage.jsx');
