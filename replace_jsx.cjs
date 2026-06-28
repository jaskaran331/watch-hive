const fs = require('fs');
let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Replace hero variable with state logic
jsx = jsx.replace(
  'const hero = trending[0];',
  `const [heroIndex, setHeroIndex] = useState(0);

  // Auto-play
  useEffect(() => {
    if (!trending || trending.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trending.length, 5));
    }, 6000);
    return () => clearInterval(interval);
  }, [trending]);

  const currentHero = trending[heroIndex] || trending[0];

  const nextHero = () => setHeroIndex((prev) => (prev + 1) % Math.min(trending.length, 5));
  const prevHero = () => setHeroIndex((prev) => (prev - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5));`
);

// Replace hero JSX block
jsx = jsx.replace(
  /\{\/\* ── Hero \(always first\) ── \*\/\}([\s\S]*?)<\/div>\s*\n\s*\)/m,
  `{/* ── Hero (always first) ── */}
      {!loading && currentHero && (
        <div className="hero">
          <div
            className="hero-bg"
            style={{
              backgroundImage: \`url(\${imgUrl(currentHero.backdrop_path, "original")})\`,
            }}
          />
          <div className="hero-gradient" />
          
          <button className="hero-nav-btn left" onClick={prevHero}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="hero-content">
            <div className="hero-type">NOW STREAMING</div>
            <div className="hero-title">{currentHero.title || currentHero.name}</div>
            <div className="hero-meta">
              <span className="hero-rating">
                <StarIcon /> {currentHero.vote_average?.toFixed(1)}
              </span>
              <span>{currentHero.release_date?.slice(0, 4) || currentHero.first_air_date?.slice(0, 4)}</span>
            </div>
            <div className="hero-overview">{currentHero.overview}</div>
            <div className="hero-actions">
              <button
                className="btn btn-yellow"
                onClick={() => onSelect(currentHero)}
              >
                <PlayIcon /> Watch Now
              </button>
            </div>
          </div>

          <button className="hero-nav-btn right" onClick={nextHero}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )`
);

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
