const fs = require('fs');

let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// I need to fix the allItems declaration and anything that was accidentally removed
const regex = /const allItems = useMemo\([\s\S]*?\[ratingsMap\],\s*\);/m;

const replacement = `const allItems = useMemo(
    () => [
      ...inProgress,
      ...trending.map((i) => ({ ...i, media_type: "movie" })),
      ...trendingTV.map((i) => ({ ...i, media_type: "tv" })),
      ...recommendedItems,
      ...topRated,
      ...bingeWorthy.map((i) => ({ ...i, media_type: "tv" })),
      ...anime.map((i) => ({ ...i, media_type: "tv" })),
    ],
    [inProgress, trending, trendingTV, recommendedItems, topRated, bingeWorthy, anime]
  );

  const { ratingsMap, ageLimitSetting } = useRatings(allItems);

  const getRating = useCallback(
    (item) => getRatingForItem(item, ratingsMap),
    [ratingsMap],
  );`;

jsx = jsx.replace(regex, replacement);

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
