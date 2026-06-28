const fs = require('fs');
let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Split topRatedItems into movies and TV
jsx = jsx.replace(
  'const [topRatedItems, setTopRatedItems] = useState([]);',
  `const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedTV, setTopRatedTV] = useState([]);`
);

jsx = jsx.replace(
  /...topRatedItems,/g,
  `...topRatedMovies,
      ...topRatedTV,`
);

jsx = jsx.replace(
  /\[inProgress, trending, trendingTV, recommendedItems, topRatedItems\],/g,
  `[inProgress, trending, trendingTV, recommendedItems, topRatedMovies, topRatedTV],`
);

// Update fetch logic
jsx = jsx.replace(
  /\/\/ Interleave movies and TV for variety[\s\S]*?setTopRatedItems\(merged\);/,
  `setTopRatedMovies(movies);
        setTopRatedTV(tv);`
);

// Update renderList to pass rank if requested
jsx = jsx.replace(
  /const renderList = \(key, title, titleHighlight, items\) => \{/g,
  `const renderList = (key, title, titleHighlight, items, isRanked = false) => {`
);

jsx = jsx.replace(
  /<MediaCard\s+key=\{\`\$\{item\.media_type\}_\$\{item\.id\}\`\}\s+item=\{item\}\s+onClick=\{\(\) => onSelect\(item\)\}/g,
  `<MediaCard
                      key={\`\${item.media_type}_\${item.id}\`}
                      item={item}
                      onClick={() => onSelect(item)}
                      rank={isRanked ? items.indexOf(item) + 1 : undefined}`
);

// Replace topRated render block with topRatedMovies and topRatedTV
jsx = jsx.replace(
  /if \(id === "topRated"\) \{[\s\S]*?return null;\s*\}/m,
  `if (id === "topRated") {
          return (
            <React.Fragment key="topRatedGroup">
              {topRatedMovies.length > 0 && effectiveViewMode === "list"
                ? renderList("topRatedMovies", "India's Top Movies", null, topRatedMovies, true)
                : topRatedMovies.length > 0 && (
                    <TrendingCarousel
                      key="topRatedMovies"
                      items={topRatedMovies}
                      title="India's Top Movies"
                      onSelect={onSelect}
                      ratingsMap={enrichedRatingsMap}
                      isRanked={true}
                    />
                  )}
              {topRatedTV.length > 0 && effectiveViewMode === "list"
                ? renderList("topRatedTV", "India's Top Shows", null, topRatedTV, true)
                : topRatedTV.length > 0 && (
                    <TrendingCarousel
                      key="topRatedTV"
                      items={topRatedTV}
                      title="India's Top Shows"
                      onSelect={onSelect}
                      ratingsMap={enrichedRatingsMap}
                      isRanked={true}
                    />
                  )}
            </React.Fragment>
          );
        }`
);

// Also need to import React if we use React.Fragment
if (!jsx.includes('import React')) {
  jsx = jsx.replace(/import \{ useState/, 'import React, { useState');
}

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
