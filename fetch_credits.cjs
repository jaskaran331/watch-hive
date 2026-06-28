const fs = require('fs');

function addCredits(file) {
  let jsx = fs.readFileSync(file, 'utf8');
  if (file.includes('MoviePage')) {
    jsx = jsx.replace(
      /tmdbFetch\(\`\/movie\/\$\{item.id\}\`, apiKey\)/,
      "tmdbFetch(`/movie/${item.id}?append_to_response=credits`, apiKey)"
    );
  } else if (file.includes('TVPage')) {
    jsx = jsx.replace(
      /tmdbFetch\(\`\/tv\/\$\{item.id\}\`, apiKey\)/,
      "tmdbFetch(`/tv/${item.id}?append_to_response=credits`, apiKey)"
    );
  }
  fs.writeFileSync(file, jsx);
}

addCredits('src/pages/MoviePage.jsx');
addCredits('src/pages/TVPage.jsx');
