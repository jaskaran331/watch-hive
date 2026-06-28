const fs = require('fs');

function updateTheme() {
  let css = fs.readFileSync('src/styles/global.css', 'utf8');
  
  // Replace the :root block completely to be sure
  const newRoot = `:root {
    --bg: #000000;
    --surface: rgba(25, 25, 25, 0.6);
    --surface2: rgba(40, 40, 40, 0.7);
    --surface3: rgba(55, 55, 55, 0.8);
    --border: rgba(245, 197, 24, 0.25);
    --red: #F5C518;
    --red2: #FFD700;
    --red-dim: rgba(245, 197, 24, 0.15);
    --red-glow: 0 0 30px rgba(245, 197, 24, 0.4);
    --gold: #FFD700;
    --text: #ffffff;
    --text2: #cccccc;
    --text3: #888888;
    --sidebar: 72px;
    --radius: 12px;
    --font-display: "Bebas Neue", sans-serif;
    --font-body: "DM Sans", sans-serif;
}`;

  css = css.replace(/:root\s*\{[\s\S]*?\}/, newRoot);
  fs.writeFileSync('src/styles/global.css', css);
}

function updateHomePage() {
  let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

  // Add the new row definitions
  // Currently rowOrder is ["hero", "topRated", "continue", "favorites", "bookmarks", "upcoming"]
  // But previously I added topRatedMovies and topRatedTV.
  // Wait, let's see how rowOrder is defined.
  
  const replacements = [
    {
      target: /const rowOrder = \[.*?\];/s,
      replacement: `const rowOrder = [
    "hero",
    "continue",
    "topRated",
    "bingeWorthy",
    "anime",
    "favorites",
    "bookmarks",
    "upcoming",
  ];`
    },
    // We need to add state for the new categories
    {
      target: /const \[topRatedMovies, setTopRatedMovies\] = useState\(\[\]\);\s*const \[topRatedTV, setTopRatedTV\] = useState\(\[\]\);/,
      replacement: `const [topRated, setTopRated] = useState([]);
  const [bingeWorthy, setBingeWorthy] = useState([]);
  const [anime, setAnime] = useState([]);`
    },
    // Inside useEffect
    {
      target: /const moviesRes = await tmdbFetch\("\/movie\/top_rated\?page=1", apiKey\);\s*if \(mounted\) setTopRatedMovies\(moviesRes\.results \|\| \[\]\);\s*const tvRes = await tmdbFetch\("\/tv\/top_rated\?page=1", apiKey\);\s*if \(mounted\) setTopRatedTV\(tvRes\.results \|\| \[\]\);/,
      replacement: `const topRatedRes = await tmdbFetch("/movie/top_rated?page=1", apiKey);
        if (mounted) setTopRated(topRatedRes.results || []);

        const bingeRes = await tmdbFetch("/tv/popular?page=1", apiKey);
        if (mounted) setBingeWorthy(bingeRes.results || []);

        const animeRes = await tmdbFetch("/discover/tv?with_genres=16&with_original_language=ja&page=1", apiKey);
        if (mounted) setAnime(animeRes.results || []);`
    },
    // Also remove the old fetch mapping if it was slightly different
  ];

  for (let r of replacements) {
    if(jsx.match(r.target)) {
        jsx = jsx.replace(r.target, r.replacement);
    }
  }

  // In the JSX return, we need to replace the topRated block with the new blocks.
  const blockRegex = /\{\/\* ── Top Rated Rows ── \*\/\}.*?\{\/\* ── Rows in user-configured order ── \*\/\}/s;
  if(jsx.match(blockRegex)) {
      jsx = jsx.replace(blockRegex, `\{/* ── Rows in user-configured order ── */\}`);
  }

  // Inside the map loop, add the render logic for topRated, bingeWorthy, anime
  // Actually, I can just append them to the switch/if block inside \`rowOrder.map\`
  
  // Wait, I will use regex to find where \`if (id === "topRated")\` or \`if (id === "continue")\` is and insert our sections.
  
  const sectionsReplacement = `
        if (id === "topRated") {
          return renderList("topRated", "Top Rated", null, topRated);
        }
        
        if (id === "bingeWorthy") {
          return renderList("bingeWorthy", "Binge Worthy TV Shows", null, bingeWorthy);
        }
        
        if (id === "anime") {
          return renderList("anime", "Anime", null, anime);
        }
        
        if (id === "favorites") {
`;
  jsx = jsx.replace(/\s*if \(id === "favorites"\) \{/, sectionsReplacement);

  fs.writeFileSync('src/pages/HomePage.jsx', jsx);
}

updateTheme();
updateHomePage();
