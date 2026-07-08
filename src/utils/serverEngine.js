// ── Server Engine ─────────────────────────────────────────────────────────────
// Tracks streaming-server performance per user and auto-selects the best one.
// All data is persisted to localStorage so it learns over time.
//
// Scoring:
//   Base score = 100.  Each event adjusts the running score.
//   - Successful load:  score += max(20 - loadTimeSec*2, 2)   (faster = more points)
//   - Timeout/failure:  score -= 30
//   - Scores are clamped to [0, 200] and decay toward 100 over days of inactivity.
//
// Usage:
//   import { serverEngine } from './serverEngine';
//   const best = serverEngine.getBestServer(false);   // non-anime
//   serverEngine.reportLoad('videasy', 2300);         // loaded in 2.3s
//   serverEngine.reportFailure('nxsha');               // timed out
// ──────────────────────────────────────────────────────────────────────────────

import { PLAYER_SOURCES } from "./api";

const STORAGE_KEY = "wh_server_scores";
const DEFAULT_SCORE = 100;
const MIN_SCORE = 0;
const MAX_SCORE = 200;
// How many recent events to keep per server (ring buffer)
const MAX_EVENTS = 20;
// Servers that haven't been used in this many ms decay toward DEFAULT_SCORE
const DECAY_HALF_LIFE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ── Persistence ──────────────────────────────────────────────────────────────

function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // localStorage full or blocked — degrade gracefully
  }
}

// ── Decay ────────────────────────────────────────────────────────────────────
// Scores drift back toward DEFAULT_SCORE when a server hasn't been tested
// recently, so stale bad/good impressions don't permanently lock a server.

function applyDecay(entry) {
  if (!entry.lastEvent) return entry.score;
  const elapsed = Date.now() - entry.lastEvent;
  if (elapsed < 60_000) return entry.score; // no decay within 1 minute
  const factor = Math.pow(0.5, elapsed / DECAY_HALF_LIFE_MS);
  // Blend toward DEFAULT_SCORE
  return DEFAULT_SCORE + (entry.score - DEFAULT_SCORE) * factor;
}

// ── Engine ───────────────────────────────────────────────────────────────────

class ServerEngine {
  constructor() {
    this._cache = null; // lazy-loaded
  }

  /** @returns {Record<string, { score: number, lastEvent: number, loads: number, failures: number }>} */
  _getScores() {
    if (!this._cache) this._cache = loadScores();
    return this._cache;
  }

  _getEntry(serverId) {
    const scores = this._getScores();
    if (!scores[serverId]) {
      scores[serverId] = {
        score: DEFAULT_SCORE,
        lastEvent: 0,
        loads: 0,
        failures: 0,
      };
    }
    return scores[serverId];
  }

  _persist() {
    saveScores(this._getScores());
  }

  /**
   * Record a successful iframe load.
   * @param {string} serverId - e.g. "videasy"
   * @param {number} loadTimeMs - how long the iframe took to fire onLoad
   */
  reportLoad(serverId, loadTimeMs) {
    const entry = this._getEntry(serverId);
    const loadTimeSec = loadTimeMs / 1000;
    // Fast loads (< 3s) earn up to +20, slow loads (> 10s) earn only +2
    const bonus = Math.max(20 - loadTimeSec * 2, 2);
    entry.score = Math.min(MAX_SCORE, applyDecay(entry) + bonus);
    entry.lastEvent = Date.now();
    entry.loads = (entry.loads || 0) + 1;
    this._persist();
  }

  /**
   * Record a failure (timeout, error, DNS block).
   * @param {string} serverId
   */
  reportFailure(serverId) {
    const entry = this._getEntry(serverId);
    entry.score = Math.max(MIN_SCORE, applyDecay(entry) - 30);
    entry.lastEvent = Date.now();
    entry.failures = (entry.failures || 0) + 1;
    this._persist();
  }

  /**
   * Get the effective (decay-adjusted) score for a server.
   * @param {string} serverId
   * @returns {number}
   */
  getScore(serverId) {
    const entry = this._getEntry(serverId);
    return Math.round(applyDecay(entry));
  }

  /**
   * Get all non-async servers ranked by score (best first).
   * @param {boolean} isAnime - if true, include anime-tagged servers; if false, exclude them
   * @returns {Array<{ id: string, label: string, score: number }>}
   */
  getRankedServers(isAnime = false) {
    return PLAYER_SOURCES
      .filter((s) => {
        if (s.async) return false; // async sources use a different flow
        if (isAnime) return true;  // anime mode: all non-async sources are valid
        return !s.tag;             // non-anime mode: exclude tagged (ANIME) sources
      })
      .map((s) => ({
        id: s.id,
        label: s.label,
        score: this.getScore(s.id),
        tag: s.tag,
        note: s.note,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get the best server ID for the current context.
   * @param {boolean} isAnime
   * @returns {string} server ID
   */
  getBestServer(isAnime = false) {
    const ranked = this.getRankedServers(isAnime);
    return ranked.length > 0 ? ranked[0].id : PLAYER_SOURCES[0].id;
  }

  /**
   * Get the next-best server after the current one (for failover).
   * @param {string} currentId - the server that just failed
   * @param {boolean} isAnime
   * @returns {string|null} next server ID or null if none left
   */
  getNextBest(currentId, isAnime = false) {
    const ranked = this.getRankedServers(isAnime);
    const idx = ranked.findIndex((s) => s.id === currentId);
    // Return the next one in ranking, or the first one if current isn't found
    if (idx < 0) return ranked.length > 0 ? ranked[0].id : null;
    if (idx + 1 < ranked.length) return ranked[idx + 1].id;
    // Wrap around — all servers tried, go back to best (might have recovered)
    return ranked[0].id !== currentId ? ranked[0].id : null;
  }

  /**
   * Get the domain of a server for preconnect hints.
   * @param {string} serverId
   * @returns {string|null} origin URL
   */
  getServerOrigin(serverId) {
    const src = PLAYER_SOURCES.find((s) => s.id === serverId);
    if (!src) return null;
    try {
      const url = new URL(src.movieUrl("0"));
      return url.origin;
    } catch {
      return null;
    }
  }

  /**
   * Preconnect to the best server's domain to reduce latency.
   * Injects a <link rel="preconnect"> into <head> if not already present.
   * @param {boolean} isAnime
   */
  preconnectBestServer(isAnime = false) {
    const best = this.getBestServer(isAnime);
    const origin = this.getServerOrigin(best);
    if (!origin) return;

    const id = `preconnect-${best}`;
    if (document.getElementById(id)) return; // already exists

    const link = document.createElement("link");
    link.id = id;
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);

    // Also add dns-prefetch as a fallback for older browsers
    const dns = document.createElement("link");
    dns.rel = "dns-prefetch";
    dns.href = origin;
    document.head.appendChild(dns);
  }

  /**
   * Reset all scores back to default (for debugging or settings reset).
   */
  reset() {
    this._cache = {};
    saveScores({});
  }
}

// Singleton export — one engine instance for the whole app
export const serverEngine = new ServerEngine();
