const fs = require('fs');

let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Replace the old topRated logic with the new rows logic
const regex = /if \(id === "topRated"\) \{[\s\S]*?return null;\s*\}/m;

const replacement = `
        if (id === "topRated") {
          if (topRated.length === 0) return null;
          if (effectiveViewMode === "list") return renderList("topRated", "Top Rated", null, topRated);
          return <TrendingCarousel key="topRated" items={topRated} title="Top Rated" onSelect={onSelect} ratingsMap={enrichedRatingsMap} />;
        }
        
        if (id === "bingeWorthy") {
          if (bingeWorthy.length === 0) return null;
          if (effectiveViewMode === "list") return renderList("bingeWorthy", "Binge Worthy TV Shows", null, bingeWorthy);
          return <TrendingCarousel key="bingeWorthy" items={bingeWorthy} title="Binge Worthy TV Shows" onSelect={onSelect} ratingsMap={enrichedRatingsMap} />;
        }
        
        if (id === "anime") {
          if (anime.length === 0) return null;
          if (effectiveViewMode === "list") return renderList("anime", "Anime", null, anime);
          return <TrendingCarousel key="anime" items={anime} title="Anime" onSelect={onSelect} ratingsMap={enrichedRatingsMap} />;
        }
`;

jsx = jsx.replace(regex, replacement);

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
