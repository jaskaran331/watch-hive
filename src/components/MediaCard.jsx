import { useState, useEffect, useRef, useCallback, memo } from "react";
import { imgUrl, isAnimeContent } from "../utils/api";
import {
  PlayIcon,
  FilmIcon,
  TVIcon,
  WatchedIcon,
  RatingShieldIcon,
  RatingLockIcon,
} from "./Icons";


// ⚡ Bolt Performance Optimization:
// By default, React.memo does a shallow comparison of all props.
// However, 'watched' is a global dictionary (Object) that tracks watched statuses.
// If *any* item is marked watched, the reference to the 'watched' object changes,
// causing O(N) re-renders for all MediaCards on the screen, even if their specific
// watched status didn't change.
// This custom equality function avoids those unnecessary re-renders by doing a
// shallow compare on all other props, but checking *only* the specific watchedKey
// for this item inside the 'watched' prop.
// Impact: Reduces re-renders from O(N) -> O(1) when marking items as watched.
function arePropsEqual(prevProps, nextProps) {
  const getWatchedKey = (item) => {
    if (!item) return null;
    const isTV = item.media_type === "tv";
    return isTV
      ? item.season != null && item.episode != null
        ? `tv_${item.id}_s${item.season}e${item.episode}`
        : `tv_${item.id}`
      : `movie_${item.id}`;
  };

  const prevKey = getWatchedKey(prevProps.item);
  const nextKey = getWatchedKey(nextProps.item);

  if (prevKey !== nextKey) return false;

  const prevIsWatched = !!prevProps.watched?.[prevKey];
  const nextIsWatched = !!nextProps.watched?.[nextKey];

  if (prevIsWatched !== nextIsWatched) return false;

  const keys = Object.keys(prevProps);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'watched') continue;
    if (prevProps[key] !== nextProps[key]) return false;
  }

  const nextKeys = Object.keys(nextProps);
  if (keys.length !== nextKeys.length) return false;

  return true;
}

const MediaCard = memo(function MediaCard({

  item,
  onClick,
  progress,
  watched,
  onMarkWatched,
  onMarkUnwatched,
  ageRating,
  restricted,
  rank,
}) {
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const isTV = item.media_type === "tv";
  const isAnime = isAnimeContent(item);

  // Unreleased detection
  const rawDate = item.release_date || item.first_air_date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isUnreleased = rawDate ? new Date(rawDate) > today : false;

  // Build watched key for TV cards from Continue Watching we get season/episode
  const watchedKey = isTV
    ? item.season != null && item.episode != null
      ? `tv_${item.id}_s${item.season}e${item.episode}`
      : `tv_${item.id}`
    : `movie_${item.id}`;

  const isWatched = !!watched?.[watchedKey];

  // Context menu state
  const [menu, setMenu] = useState(null); // { x, y }
  const menuRef = useRef(null);

  // For TV series cards without a specific episode, watched marking is disabled
  const canMarkWatched = !isTV || (item.season != null && item.episode != null);

  const openMenu = useCallback(
    (e) => {
      if (!canMarkWatched) return; // no context menu for whole series
      e.preventDefault();
      e.stopPropagation();
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [canMarkWatched],
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [menu]);

  const handleMarkWatched = (e) => {
    e.stopPropagation();
    onMarkWatched?.(watchedKey);
    setMenu(null);
  };
  const handleMarkUnwatched = (e) => {
    e.stopPropagation();
    onMarkUnwatched?.(watchedKey);
    setMenu(null);
  };

  const handleClick = useCallback(() => {
    onClick?.(item);
  }, [onClick, item]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(item);
    }
  }, [onClick, item]);

  return (
    <>
      <div
        className={`card${isWatched ? " ep-watched" : ""}${isUnreleased ? " card--unreleased" : ""}`}
        onClick={handleClick}
        onContextMenu={isUnreleased ? undefined : openMenu}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="card-poster">
          {item.poster_path ? (
            <img
              src={imgUrl(item.poster_path, "w342")}
              srcSet={`${imgUrl(item.poster_path, 'w185')} 185w, ${imgUrl(item.poster_path, 'w342')} 342w, ${imgUrl(item.poster_path, 'w500')} 500w`}
              sizes="(max-width: 700px) 115px, 150px"
              alt={title}
              loading="lazy"
              decoding="async"
              width="342"
              height="513"
              style={{ aspectRatio: "2 / 3" }}
            />
          ) : (
            <div className="no-poster">
              {isTV ? <TVIcon /> : <FilmIcon />}
              <span style={{ fontSize: 10, color: "var(--text3)" }}>
                No Image
              </span>
            </div>
          )}
          {ageRating && (
            <div
              className={`card-age-badge${restricted ? " card-age-badge--restricted" : ""}`}
            >
              {restricted ? (
                <RatingLockIcon size={9} />
              ) : (
                <RatingShieldIcon size={9} />
              )}
              {ageRating}
            </div>
          )}

          <div className="card-overlay">
            {isUnreleased ? (
              <div className="card-unreleased-overlay">
                <span className="card-unreleased-label">🔒 Unreleased</span>
              </div>
            ) : (
              <div className="card-play">
                <PlayIcon />
              </div>
            )}
          </div>
          {!isUnreleased && progress > 0 && !isWatched && (
            <div className="card-progress">
              <div
                className="card-progress-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
          {!isUnreleased && isWatched && (
            <div className="card-watched-badge">
              <WatchedIcon size={26} />
            </div>
          )}
          {rank != null && (
            <div className="card-rank">{rank}</div>
          )}
        </div>
        <div className="card-info">
          <div className="card-title" title={title}>
            {title}
          </div>
          <div className="card-year">
            {isTV && item.season != null && item.episode != null
              ? `S${item.season}E${item.episode}${item.episodeName ? ` · ${item.episodeName}` : ""}`
              : `${year} · ${isTV ? "Series" : "Movie"}`}
          </div>
        </div>
        <span
          className={`card-badge${isUnreleased ? " card-badge--unreleased" : ""}${isAnime && !isUnreleased ? " card-badge--anime" : ""}`}
        >
          {isUnreleased ? "SOON" : isAnime ? "ANIME" : isTV ? "TV" : "HD"}
        </span>
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {isWatched ? (
            <button className="context-menu-item" onClick={handleMarkUnwatched}>
              ↩ Mark as Unwatched
            </button>
          ) : (
            <button className="context-menu-item" onClick={handleMarkWatched}>
              ✓ Mark as Watched
            </button>
          )}
        </div>
      )}
    </>
  );
}, arePropsEqual);
export default MediaCard;
