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

 // Disable pip and fullscreen IPC
 content = content.replace(/const enterH = window\.electron\?\.onWebviewEnterFullscreen\?\.[\s\S]*?\}\);/g, '');
 content = content.replace(/const leaveH = window\.electron\?\.onWebviewLeaveFullscreen\?\.[\s\S]*?\}\);/g, '');
 content = content.replace(/if \(enterH\) window\.electron\?\.offWebviewEnterFullscreen\?\.\(enterH\);/g, '');
 content = content.replace(/if \(leaveH\) window\.electron\?\.offWebviewLeaveFullscreen\?\.\(leaveH\);/g, '');

 // Disable window.electron?.onPipOpened
 content = content.replace(/const openH = window\.electron\?\.onPipOpened\?\.[\s\S]*?\}\);/g, '');
 content = content.replace(/const closeH = window\.electron\?\.onPipClosed\?\.[\s\S]*?\}\);/g, '');
 content = content.replace(/if \(openH\) window\.electron\?\.offPipOpened\?\.\(openH\);/g, '');
 content = content.replace(/if \(closeH\) window\.electron\?\.offPipClosed\?\.\(closeH\);/g, '');

 // Disable window.electron?.queryVideoProgress
 content = content.replace(/window\.electron\?\.queryVideoProgress/g, 'false');

 // Disable wv.executeJavaScript
 content = content.replace(/wv\.executeJavaScript/g, 'Promise.reject().catch');

 // Disable webview.getWebContentsId
 content = content.replace(/wv\.getWebContentsId\(\)/g, 'null');

 // Disable window.electron?.openPipWindow
 content = content.replace(/window\.electron\?\.openPipWindow\?\.[\s\S]*?\);/g, '');

 // Disable window.electron?.closePipWindow
 content = content.replace(/window\.electron\?\.closePipWindow\?\.[\s\S]*?\);/g, '');

 fs.writeFileSync(file, content, 'utf8');
 console.log('Fixed', file);
}

fixFile('src/pages/MoviePage.jsx');
fixFile('src/pages/TVPage.jsx');
