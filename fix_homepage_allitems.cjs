const fs = require('fs');

let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Fix allItems to use the new state variables
const allItemsTarget = /const allItems = useMemo\([\s\S]*?\]\,/m;
const allItemsReplacement = `const allItems = useMemo(
    () => [
      ...inProgress,
      ...trending.map((i) => ({ ...i, media_type: "movie" })),
      ...trendingTV.map((i) => ({ ...i, media_type: "tv" })),
      ...recommendedItems,
      ...topRated,
      ...bingeWorthy.map((i) => ({ ...i, media_type: "tv" })),
      ...anime.map((i) => ({ ...i, media_type: "tv" })),
    ],
    [inProgress, trending, trendingTV, recommendedItems, topRated, bingeWorthy, anime],`;

jsx = jsx.replace(allItemsTarget, allItemsReplacement);

// Also I noticed in my previous update script, I might not have successfully replaced the fetch logic.
// Let's check if the fetch logic is still using topRatedMovies and replace it if so.

const fetchRegex = /const moviesRes = await tmdbFetch\("\/movie\/top_rated\?page=1", apiKey\);\s*if \(mounted\) setTopRatedMovies\(moviesRes\.results \|\| \[\]\);\s*const tvRes = await tmdbFetch\("\/tv\/top_rated\?page=1", apiKey\);\s*if \(mounted\) setTopRatedTV\(tvRes\.results \|\| \[\]\);/g;

if (jsx.match(fetchRegex)) {
  const fetchReplacement = `
        const topRatedRes = await tmdbFetch("/movie/top_rated?page=1", apiKey);
        if (mounted) setTopRated(topRatedRes.results || []);

        const bingeRes = await tmdbFetch("/tv/popular?page=1", apiKey);
        if (mounted) setBingeWorthy(bingeRes.results || []);

        const animeRes = await tmdbFetch("/discover/tv?with_genres=16&with_original_language=ja&page=1", apiKey);
        if (mounted) setAnime(animeRes.results || []);
`;
  jsx = jsx.replace(fetchRegex, fetchReplacement);
}

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
