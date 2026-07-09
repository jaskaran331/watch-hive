import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import MediaCard from "../components/MediaCard";
import TrendingCarousel from "../components/TrendingCarousel";
import RatingBadge from "../components/RatingBadge";
import { PlayIcon, StarIcon } from "../components/Icons";
import { imgUrl, tmdbFetch } from "../utils/api";
import { useRatings, getRatingForItem } from "../utils/useRatings";
import { isRestricted } from "../utils/ageRating";
import { storage } from "../utils/storage";
import { loadHomeLayout, loadHomeViewMode } from "../utils/homeLayout";

/**
 * Extract up to `count` unique, recently watched items from the user's
 * history (within the last 30 days).  Returns newest-first and dedupes
 * by TMDB id + media_type so we don't fire duplicate API calls.
 */
function getRecentHistoryItems(history, count = 5) {
  if (!history || history.length === 0) return [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = history
    .filter((h) => h.watchedAt && h.watchedAt > thirtyDaysAgo)
    .sort((a, b) => b.watchedAt - a.watchedAt);

  const seen = new Set();
  const unique = [];
  for (const item of recent) {
    const key = `${item.media_type || "movie"}_${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= count) break;
  }
  return unique;
}

export default function HomePage({
  trending,
  trendingTV,
  loading,
  onSelect,
  progress,
  inProgress,
  offline,
  onRetry,
  watched,
  onMarkWatched,
  onMarkUnwatched,
  history,
  apiKey,
}) {
  const [heroIndex, setHeroIndex] = useState(0);

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
  const prevHero = () => setHeroIndex((prev) => (prev - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5));

  const [recommendedItems, setRecommendedItems] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [bingeWorthy, setBingeWorthy] = useState([]);
  const [anime, setAnime] = useState([]);

  // Load layout config (order + visibility) once on mount
  const [layout] = useState(() => loadHomeLayout());
  const { order: rowOrder, visible: rowVisible } = layout;

  const [viewMode] = useState(() => loadHomeViewMode());

  // Force the flat grid layout on mobile widths regardless of the user's
  // stored carousel/list preference — the centered carousel only shows one
  // full card at a time on narrow screens, which feels broken on phones.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 700,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const effectiveViewMode = isMobile ? "list" : viewMode;

  // All items for batch ratings fetch
  const allItems = useMemo(
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
  );
  const itemRestricted = useCallback(
    (item) =>
      isRestricted(getRatingForItem(item, ratingsMap).minAge, ageLimitSetting),
    [ratingsMap, ageLimitSetting],
  );

  // Enrich ratingsMap with restricted flag for carousels
  const enrichedRatingsMap = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(ratingsMap)) {
      out[k] = { ...v, restricted: isRestricted(v.minAge, ageLimitSetting) };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingsMap, ageLimitSetting]);

  // Filter recommended items that exceed age limit setting
  const filteredRecommendedItems = useMemo(() => {
    return recommendedItems.filter((item) => !itemRestricted(item));
  }, [recommendedItems, itemRestricted]);

  // Fetch personalised recommendations from multiple recent history items
  useEffect(() => {
    if (!apiKey || offline || !history || history.length === 0) return;
    const sources = getRecentHistoryItems(history, 5);
    if (sources.length === 0) return;

    const controller = new AbortController();

    // Build a Set of already-watched TMDB ids for dedup
    const watchedIds = new Set(
      (history || []).map((h) => `${h.media_type || "movie"}_${h.id}`),
    );

    // For each source, try /recommendations first, fall back to /similar
    const fetches = sources.map((source) => {
      const type = source.media_type === "tv" ? "tv" : "movie";
      return tmdbFetch(`/${type}/${source.id}/recommendations`, apiKey, {
        signal: controller.signal,
      })
        .then((data) => {
          const results = (data.results || []).map((i) => ({
            ...i,
            media_type: type,
          }));
          if (results.length > 0) return results;
          // Fall back to /similar if /recommendations returned nothing
          return tmdbFetch(`/${type}/${source.id}/similar`, apiKey, {
            signal: controller.signal,
          }).then((d) =>
            (d.results || []).map((i) => ({ ...i, media_type: type })),
          );
        })
        .catch(() => []);
    });

    Promise.all(fetches)
      .then((arrays) => {
        // Interleave results from each source for variety
        const merged = [];
        const maxLen = Math.max(...arrays.map((a) => a.length));
        for (let i = 0; i < maxLen; i++) {
          for (const arr of arrays) {
            if (arr[i]) merged.push(arr[i]);
          }
        }

        // Deduplicate and filter out already-watched items
        const seen = new Set();
        const deduped = merged.filter((item) => {
          const key = `${item.media_type}_${item.id}`;
          if (seen.has(key) || watchedIds.has(key)) return false;
          seen.add(key);
          return true;
        });

        setRecommendedItems(deduped.slice(0, 20));
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          console.warn("Recommendations fetch failed", e);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, offline, history?.length]);

  // Fetch top rated movies + TV, merge and shuffle
  useEffect(() => {
    if (!apiKey || offline) return;
    const controller = new AbortController();
        Promise.all([
      tmdbFetch("/movie/top_rated?page=1", apiKey, { signal: controller.signal }),
      tmdbFetch("/tv/popular?page=1", apiKey, { signal: controller.signal }),
      tmdbFetch("/discover/tv?with_genres=16&with_original_language=ja&page=1", apiKey, { signal: controller.signal }),
    ])
      .then(([topData, popularData, animeData]) => {
        const top = (topData.results || []).slice(0, 10).map((i) => ({ ...i, media_type: "movie" }));
        const pop = (popularData.results || []).slice(0, 10).map((i) => ({ ...i, media_type: "tv" }));
        const ani = (animeData.results || []).slice(0, 10).map((i) => ({ ...i, media_type: "tv" }));
        
        // Ensure both states are set so UI renders
        setTopRated(top);
        setBingeWorthy(pop);
        setAnime(ani);
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.warn("Top rated fetch failed", e);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, offline]);

  // Stable pre-built item arrays for carousels, capped at 10
  const trendingMovieItems = useMemo(
    () => trending.slice(0, 10).map((i) => ({ ...i, media_type: "movie" })),
    [trending],
  );
  const trendingTVItems = useMemo(
    () => trendingTV.slice(0, 10).map((i) => ({ ...i, media_type: "tv" })),
    [trendingTV],
  );

  return (
    <div className="fade-in">
      <Helmet>
        <title>Watch Hive - Free Movies &amp; TV Shows</title>
        <meta name="description" content="Stream the latest movies and TV shows for free in HD on Watch Hive." />
        <meta property="og:title" content="Watch Hive - Free Movies &amp; TV Shows" />
        <meta property="og:description" content="Stream the latest movies and TV shows for free in HD on Watch Hive." />
        <meta name="twitter:title" content="Watch Hive - Free Movies &amp; TV Shows" />
        <meta name="twitter:description" content="Stream the latest movies and TV shows for free in HD on Watch Hive." />
      </Helmet>
      {/* ── Offline ── */}
      {offline && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: 16,
            color: "var(--text2)",
          }}
        >
          <div style={{ fontSize: 48 }}>📡</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>
            No internet connection
          </div>
          <div style={{ fontSize: 14, color: "var(--text3)" }}>
            Trending and search require an internet connection. Your downloads
            and library still work offline.
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8 }}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}

      {!offline && loading && (
        <div className="loader">
          <div className="spinner" />
        </div>
      )}

      {/* ── Hero (always first) ── */}
      <div className="hero">
        {(!loading && currentHero) ? (
          <>
            <div className="hero-bg">
              <img
                src={imgUrl(currentHero.backdrop_path, "w1280")}
                alt=""
                fetchPriority="high"
                decoding="async"
                width="1280"
                height="720"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
            </div>
            <div className="hero-gradient" />
            
            <button className="hero-nav-btn left" onClick={prevHero} aria-label="Previous movie">
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
                <RatingBadge
                  cert={getRating(currentHero).cert}
                  restricted={getRating(currentHero).restricted}
                />
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
                <button
                  className="btn btn-secondary"
                  aria-label="Random pick"
                  style={{ marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                  onClick={() => {
                    const all = [...trending, ...trendingTV];
                    if (all.length > 0) {
                      const randomItem = all[Math.floor(Math.random() * all.length)];
                      onSelect(randomItem);
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <circle cx="15.5" cy="15.5" r="1.5"></circle>
                    <circle cx="15.5" cy="8.5" r="1.5"></circle>
                    <circle cx="8.5" cy="15.5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                  </svg>
                  Random Pick
                </button>
              </div>
            </div>

            <button className="hero-nav-btn right" onClick={nextHero} aria-label="Next movie">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', opacity: 0.5 }} className="skeleton-pulse" />
        )}
      </div>

      {/* ── Rows in user-configured order ── */}
      {rowOrder.map((id) => {
        if (!rowVisible[id]) return null;

        if (id === "continue") {
          if (inProgress.length === 0) return null;
          return (
            <div key="continue" className="section">
              <div className="section-title">Continue Watching</div>
              <div className="cards-grid">
                {inProgress.map((item) => {
                  const pk =
                    item.media_type === "movie"
                      ? `movie_${item.id}`
                      : `tv_${item.id}_s${item.season}e${item.episode}`;
                  const r = getRating(item);
                  const restr = itemRestricted(item);
                  return (
                    <MediaCard
                      key={`${item.media_type}_${item.id}`}
                      item={item}
                      onClick={onSelect}
                      progress={progress[pk] || 0}
                      watched={watched}
                      onMarkWatched={onMarkWatched}
                      onMarkUnwatched={onMarkUnwatched}
                      ageRating={r.cert}
                      restricted={restr}
                    />
                  );
                })}
              </div>
            </div>
          );
        }

        // Render a section as a flat cards-grid (list view)
        const renderList = (key, title, titleHighlight, items, isRanked = false) => {
          if (!items || items.length === 0) return null;
          return (
            <div key={key} className="section">
              <div className="section-title">
                {titleHighlight ? (
                  <>
                    {title}&nbsp;
                    <span style={{ color: "var(--red)" }}>
                      {titleHighlight}
                    </span>
                  </>
                ) : (
                  title
                )}
              </div>
              <div className="cards-grid">
                {items.map((item) => {
                  const type = item.media_type === "tv" ? "tv" : "movie";
                  const rk = `${type}_${item.id}`;
                  const rd = enrichedRatingsMap[rk] || {};
                  return (
                    <MediaCard
                      key={`${item.media_type}_${item.id}`}
                      item={item}
                      onClick={onSelect}
                      rank={isRanked ? items.indexOf(item) + 1 : undefined}
                      progress={0}
                      watched={watched}
                      onMarkWatched={onMarkWatched}
                      onMarkUnwatched={onMarkUnwatched}
                      ageRating={rd.cert}
                      restricted={rd.restricted}
                    />
                  );
                })}
              </div>
            </div>
          );
        };

        if (id === "recommended") {
          if (filteredRecommendedItems.length === 0) return null;
          if (effectiveViewMode === "list")
            return renderList(
              "recommended",
              "Recommended for You",
              null,
              filteredRecommendedItems,
            );
          return (
            <TrendingCarousel
              key="recommended"
              items={filteredRecommendedItems}
              title="Recommended for You"
              onSelect={onSelect}
              ratingsMap={enrichedRatingsMap}
            />
          );
        }

        if (id === "trendingMovies") {
          if (trendingMovieItems.length === 0) return null;
          if (effectiveViewMode === "list")
            return renderList(
              "trendingMovies",
              "Trending Movies",
              null,
              trendingMovieItems,
            );
          return (
            <TrendingCarousel
              key="trendingMovies"
              items={trendingMovieItems}
              title="Trending Movies"
              onSelect={onSelect}
              ratingsMap={enrichedRatingsMap}
            />
          );
        }

        if (id === "trendingTV") {
          if (trendingTVItems.length === 0) return null;
          if (effectiveViewMode === "list")
            return renderList(
              "trendingTV",
              "Trending Series",
              null,
              trendingTVItems,
            );
          return (
            <TrendingCarousel
              key="trendingTV"
              items={trendingTVItems}
              title="Trending Series"
              onSelect={onSelect}
              ratingsMap={enrichedRatingsMap}
            />
          );
        }

        
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
        return null;
      })}
    </div>
  );
}
