const fs = require('fs');
const lines = fs.readFileSync('src/pages/MoviePage.jsx', 'utf8').split('\n');
const newLines = [
  ...lines.slice(0, 852),
  '      {playing && !restricted && !isUnreleased && (',
  '        <div className="section" style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>',
  '          <iframe',
  '            src={`https://vidsrc.pro/embed/movie/${item.id}`}',
  '            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}',
  '            allowFullScreen',
  '          />',
  '        </div>',
  '      )}',
  ...lines.slice(1195)
];
fs.writeFileSync('src/pages/MoviePage.jsx', newLines.join('\n'));
