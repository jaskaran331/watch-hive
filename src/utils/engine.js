import { PLAYER_SOURCES, getSourceUrl } from "./api";

/**
 * Pings a URL to measure its response time.
 * @param {string} url The URL to ping.
 * @param {number} timeoutMs Maximum time to wait.
 * @returns {Promise<number>} Latency in ms, or Infinity if it fails/times out.
 */
async function pingServer(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const start = performance.now();
    // Using no-cors mode to simply test reachability/latency without CORS errors
    await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
    const end = performance.now();
    clearTimeout(id);
    return end - start;
  } catch (error) {
    clearTimeout(id);
    return Infinity;
  }
}

/**
 * Finds the fastest server among the given sources for the specific media.
 * Async sources (like AllManga) are handled separately or excluded from basic ping tests
 * because their actual streaming URL is resolved later via Electron IPC.
 * For now, if "auto" is selected for an anime, we might prefer the dedicated anime source.
 */
export async function findBestServer(isAnime, type, id, season, ep) {
  let applicableSources = PLAYER_SOURCES.filter(s => s.id !== "auto");

  if (isAnime) {
      // If it's anime, AllManga is typically best, but we'll include all.
      // However, AllManga doesn't have a direct pingable URL since it's async.
      // So if it's anime, we can just return AllManga immediately since it's the dedicated anime source.
      const animeSource = PLAYER_SOURCES.find(s => s.tag === "ANIME");
      if (animeSource) return animeSource.id;
  } else {
      // Filter out anime-only sources for non-anime content
      applicableSources = PLAYER_SOURCES.filter(s => s.tag !== "ANIME");
  }

  // Ping all non-async sources in parallel
  const pingPromises = applicableSources
    .filter(s => !s.async)
    .map(async (src) => {
      const url = getSourceUrl(src.id, type, id, season, ep);
      const latency = await pingServer(url);
      return { id: src.id, latency };
    });

  const results = await Promise.all(pingPromises);

  // Sort by lowest latency
  results.sort((a, b) => a.latency - b.latency);

  // Return the fastest one that isn't Infinity. If all fail, fallback to the first applicable.
  const best = results.find(r => r.latency !== Infinity);

  return best ? best.id : applicableSources[0].id;
}
