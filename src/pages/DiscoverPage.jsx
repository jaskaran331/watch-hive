import { useState, useEffect, useRef } from "react";
import { tmdbFetch } from "../utils/api";
import MediaCard from "../components/MediaCard";

export default function DiscoverPage({ apiKey, onSelect }) {
  const [mediaType, setMediaType] = useState("movie"); // "movie" or "tv"
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch genres
  useEffect(() => {
    let mounted = true;
    async function loadGenres() {
      try {
        const res = await tmdbFetch(`/genre/${mediaType}/list`, apiKey);
        if (mounted && res.genres) {
          setGenres(res.genres);
          if (res.genres.length > 0) {
            setSelectedGenre(res.genres[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    }
    loadGenres();
    return () => {
      mounted = false;
    };
  }, [mediaType, apiKey]);

  // Fetch content when genre, media type, or page changes
  useEffect(() => {
    let mounted = true;
    if (!selectedGenre) return;

    async function loadContent() {
      setLoading(true);
      try {
        const endpoint = `/discover/${mediaType}?with_genres=${selectedGenre}&page=${page}&sort_by=popularity.desc`;
        const res = await tmdbFetch(endpoint, apiKey);
        if (mounted && res.results) {
          setResults((prev) => (page === 1 ? res.results : [...prev, ...res.results]));
          setHasMore(page < res.total_pages);
        }
      } catch (err) {
        console.error("Error fetching discover content:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Reset results if page is 1
    if (page === 1) {
      setResults([]);
    }
    loadContent();

    return () => {
      mounted = false;
    };
  }, [mediaType, selectedGenre, page, apiKey]);

  return (
    <div className="page fade-in" style={{ paddingTop: 80, paddingBottom: 120 }}>
      <div className="library-header" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 var(--safe-px)" }}>
        <h1 className="library-title">Discover</h1>
        
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          {/* Media Type Toggle */}
          <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button 
              onClick={() => { setMediaType("movie"); setPage(1); }}
              style={{
                background: mediaType === "movie" ? "var(--red)" : "transparent",
                color: mediaType === "movie" ? "#000" : "var(--text2)",
                border: "none", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14
              }}>Movies</button>
            <button 
              onClick={() => { setMediaType("tv"); setPage(1); }}
              style={{
                background: mediaType === "tv" ? "var(--red)" : "transparent",
                color: mediaType === "tv" ? "#000" : "var(--text2)",
                border: "none", padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14
              }}>TV Shows</button>
          </div>
        </div>

        {/* Genres List */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", maxHeight: 150, overflowY: "auto", paddingBottom: 16 }}>
          {genres.map(g => (
            <button
              key={g.id}
              onClick={() => { setSelectedGenre(g.id); setPage(1); }}
              style={{
                background: selectedGenre === g.id ? "rgba(255, 255, 255, 0.2)" : "var(--surface2)",
                border: selectedGenre === g.id ? "1px solid var(--text)" : "1px solid rgba(255,255,255,0.1)",
                color: selectedGenre === g.id ? "var(--text)" : "var(--text2)",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "24px auto 0", padding: "0 var(--safe-px)" }}>
        {results.length > 0 ? (
          <>
            <div className="cards-grid">
              {results.map((item, i) => {
                const completeItem = { ...item, media_type: mediaType };
                return (
                  <MediaCard
                    key={`${completeItem.id}-${i}`}
                    item={completeItem}
                    onClick={onSelect}
                  />
                );
              })}
            </div>
            
            {hasMore && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 40, paddingBottom: 40 }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="loader"><div className="spinner"/></div>
        ) : (
          <div style={{ textAlign: "center", marginTop: 60, color: "var(--text3)" }}>No results found.</div>
        )}
      </div>
    </div>
  );
}
