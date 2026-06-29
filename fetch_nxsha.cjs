const https = require('https');

https.get('https://web.nxsha.app/embed/movie/550', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const regex = /(src|href)="(\/[^"]+)"/g;
    let match;
    const paths = new Set();
    while ((match = regex.exec(data)) !== null) {
      paths.add(match[2]);
    }
    console.log(Array.from(paths));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
