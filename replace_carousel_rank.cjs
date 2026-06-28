const fs = require('fs');
let jsx = fs.readFileSync('src/components/TrendingCarousel.jsx', 'utf8');

jsx = jsx.replace(
  'const CarouselSlot = memo(function CarouselSlot({',
  `const CarouselSlot = memo(function CarouselSlot({
  rank,`
);

jsx = jsx.replace(
  /className=\{\`carousel-item\$\{isCenter \? " carousel-item--active" : ""\}\$\{animating \? " carousel-item--animating" : ""\}\`\}/,
  `className={\`carousel-item\${isCenter ? " carousel-item--active" : ""}\${animating ? " carousel-item--animating" : ""}\`}`
);

// We need to add the rank to CarouselSlot
jsx = jsx.replace(
  /\{isUnreleased \? \(/,
  `{rank != null && <div className="card-rank">{rank}</div>}
        {isUnreleased ? (`
);

jsx = jsx.replace(
  /export default function TrendingCarousel\(\{[\s\S]*?\}\) \{/,
  `export default function TrendingCarousel({
  items,
  onSelect,
  title,
  titleHighlight,
  ratingsMap = {},
  isRanked = false,
}) {`
);

jsx = jsx.replace(
  /isAnime=\{isCenter \? isAnimeContent\(items\[idx\]\) : false\}/,
  `isAnime={isCenter ? isAnimeContent(items[idx]) : false}
                rank={isRanked ? idx + 1 : undefined}`
);

fs.writeFileSync('src/components/TrendingCarousel.jsx', jsx);
