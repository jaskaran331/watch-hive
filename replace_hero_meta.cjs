const fs = require('fs');
let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Add RatingBadge import
if (!jsx.includes('import RatingBadge')) {
  jsx = jsx.replace(
    'import TrendingCarousel from "../components/TrendingCarousel";',
    `import TrendingCarousel from "../components/TrendingCarousel";\nimport RatingBadge from "../components/RatingBadge";`
  );
}

// Replace the .hero-meta section
const heroMetaRegex = /<div className="hero-meta">[\s\S]*?<\/div>/;
const newHeroMeta = `<div className="hero-meta">
              <span className="hero-rating">
                <StarIcon /> {currentHero.vote_average?.toFixed(1)}
              </span>
              <RatingBadge
                cert={getRating(currentHero).cert}
                restricted={getRating(currentHero).restricted}
              />
              <span>{currentHero.release_date?.slice(0, 4) || currentHero.first_air_date?.slice(0, 4)}</span>
            </div>`;

jsx = jsx.replace(heroMetaRegex, newHeroMeta);

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
