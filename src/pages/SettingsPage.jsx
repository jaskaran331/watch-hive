import { useState, useEffect, useRef } from "react";
import {
  storage,
  STORAGE_KEYS,
  secureStorage,
  clearAppCaches,
} from "../utils/storage";
import { clearTmdbCache } from "../utils/api";
import {
  ACCENT_PRESETS,
  applyAccentColor,
  THEME_PRESETS,
  applyTheme,
  DEFAULT_CUSTOM_VARS,
} from "../utils/appearance";
import { SUBTITLE_LANGUAGES } from "../utils/subtitles";
import { DEFAULT_INVIDIOUS_BASE } from "../components/TrailerModal";
import { RATING_COUNTRIES } from "../utils/ageRating";
import { WarningIcon } from "../components/Icons";
import {
  HOME_ROWS,
  loadHomeLayout,
  loadHomeViewMode,
  saveHomeViewMode,
} from "../utils/homeLayout";
import { collectBackupData, restoreBackupData } from "../utils/backup";
import { formatBytes } from "../utils/storage";
import { HomeLayoutSection, AppearanceSection } from "../components/settings/AppearanceSection";
import { LibraryPrivacySection, TmdbLanguageSection } from "../components/settings/LibraryAndDataSection";
import { SubtitleSettingsSection } from "../components/settings/PlayerSection";
import { VersionSection, BackupRestoreSection, StartPageSection } from "../components/settings/SystemSection";

// ── Custom Select ─────────────────────────────────────────────────────────────
function SettingsSelect({ value, onChange, options, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedLabel =
    options.find((o) => String(o.value) === String(value))?.label ?? value;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 28,
          padding: "9px 14px",
          background: open ? "var(--surface3)" : "var(--surface2)",
          border: `1px solid ${open ? "var(--red)" : "var(--border)"}`,
          boxShadow: open ? "0 0 0 3px rgba(229,9,20,0.12)" : "none",
          borderRadius: 8,
          color: "var(--text)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          cursor: "pointer",
          whiteSpace: "nowrap",
          minWidth: 0,
          transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "var(--surface3)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "var(--surface2)";
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {selectedLabel}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text3)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 999,
            background: "var(--surface3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            minWidth: "100%",
            maxHeight: 280,
            overflowY: "auto",
            padding: "4px",
          }}
        >
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <div
                key={o.value}
                onMouseDown={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  borderRadius: 7,
                  cursor: "pointer",
                  color: active ? "var(--red)" : "var(--text)",
                  background: active ? "rgba(229,9,20,0.10)" : "transparent",
                  fontWeight: active ? 600 : 400,
                  transition: "background 0.1s, color 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Start page config ─────────────────────────────────────────────────────────

// Age limit options: null = none, or specific ages
const AGE_LIMIT_OPTIONS = [
  { value: "", label: "No restriction" },
  { value: "0", label: "0 — All audiences (G / FSK 0)" },
  { value: "7", label: "7 — Family friendly (PG / FSK 6)" },
  { value: "12", label: "12 — Teens and up" },
  { value: "13", label: "13 — PG-13 and equivalent" },
  { value: "15", label: "15 — Older teens" },
  { value: "16", label: "16 — FSK 16 and equivalent" },
  { value: "17", label: "17 — R / 17+ and equivalent" },
  { value: "18", label: "18 — Adults only (NC-17 / FSK 18)" },
];

// ── Confirmation Dialog ───────────────────────────────────────────────────────
function ResetConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "36px 40px",
          maxWidth: 460,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(229,9,20,0.12)",
            border: "1px solid rgba(229,9,20,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <WarningIcon size={24} />
        </div>

        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          RESET STREAMBERT?
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          This will permanently delete all your settings, watch history, saved
          titles, progress data, and cached data. Your downloaded video files
          will{" "}
          <span style={{ color: "var(--text)", fontWeight: 600 }}>not</span> be
          deleted.
          <br />
          <br />
          <span style={{ color: "var(--red)" }}>
            This action cannot be undone.
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn"
            style={{
              flex: 1,
              background: "var(--red)",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
            onClick={onConfirm}
          >
            Yes, Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generic Confirm Dialog ───────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "36px 40px",
          maxWidth: 460,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(229,9,20,0.12)",
            border: "1px solid rgba(229,9,20,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <WarningIcon size={24} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          {description}
          <br />
          <br />
          <span style={{ color: "var(--red)" }}>
            This action cannot be undone.
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn"
            style={{
              flex: 1,
              background: "var(--red)",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, title }) {
  return (
    <button
      onClick={() => onChange(!value)}
      title={title}
      style={{
        background: value ? "var(--red)" : "var(--surface2)",
        border: "1px solid " + (value ? "var(--red)" : "var(--border)"),
        borderRadius: 20,
        width: 40,
        height: 22,
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: value ? 20 : 2,
          width: 16,
          height: 16,
          background: "#fff",
          borderRadius: "50%",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (!status) return null;
  const isError = status.startsWith("✕");
  return (
    <div
      style={{
        marginTop: 10,
        fontSize: 13,
        fontWeight: 500,
        color: isError ? "var(--red)" : "#48c774",
      }}
    >
      {status}
    </div>
  );
}

// ── Clean Row ─────────────────────────────────────────────────────────────────
function CleanRow({
  title,
  description,
  buttonLabel,
  onAction,
  danger,
  sizeLabel,
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [hovered, setHovered] = useState(false);

  const handle = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await onAction();
      if (result?.cancelled) {
        // User dismissed the confirm dialog
        return;
      }
      setStatus(result?.msg || "✓ Done");
      setTimeout(() => setStatus(null), 4000);
    } catch (e) {
      setStatus("✕ " + (e.message || "Something went wrong"));
      setTimeout(() => setStatus(null), 4000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 24,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {title}
          {sizeLabel && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text2)",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "3px 10px",
                letterSpacing: 0.2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sizeLabel}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6 }}>
          {description}
        </div>
        <StatusBadge status={status} />
      </div>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <button
          className="btn btn-ghost"
          disabled={busy}
          onClick={handle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={
            danger
              ? {
                  color: hovered ? "#fff" : "var(--red)",
                  background: hovered ? "rgba(229,9,20,0.85)" : "transparent",
                  borderColor: hovered ? "transparent" : "rgba(229,9,20,0.35)",
                  opacity: busy ? 0.5 : 1,
                  transition: "all 0.2s",
                }
              : { opacity: busy ? 0.5 : 1 }
          }
        >
          {busy ? "Working…" : buttonLabel}
        </button>
      </div>
    </div>
  );
}

// ── Version & Update Section ──────────────────────────────────────────────────


// ── Home Layout Section ───────────────────────────────────────────────────────


// ── Scheduled Backup Section ──────────────────────────────────────────────────
const FREQUENCY_OPTIONS = [
  { value: "startup", label: "On App Start" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];



// ── Backup & Restore ─────────────────────────────────────────────────────────


// ── Start Page Section ────────────────────────────────────────────────────────
// ── Appearance Section ────────────────────────────────────────────────────────


// ── Library & Privacy Section ─────────────────────────────────────────────────




// ── TMDB Metadata Language ────────────────────────────────────────────────────
const TMDB_LANGUAGES = [
  { value: "en-US", label: "English (en-US)" },
  { value: "de-DE", label: "Deutsch (de-DE)" },
  { value: "fr-FR", label: "Français (fr-FR)" },
  { value: "es-ES", label: "Español (es-ES)" },
  { value: "it-IT", label: "Italiano (it-IT)" },
  { value: "pt-BR", label: "Português (Brasil) (pt-BR)" },
  { value: "nl-NL", label: "Nederlands (nl-NL)" },
  { value: "pl-PL", label: "Polski (pl-PL)" },
  { value: "sv-SE", label: "Svenska (sv-SE)" },
  { value: "nb-NO", label: "Norsk (nb-NO)" },
  { value: "da-DK", label: "Dansk (da-DK)" },
  { value: "fi-FI", label: "Suomi (fi-FI)" },
  { value: "tr-TR", label: "Türkçe (tr-TR)" },
  { value: "ru-RU", label: "Русский (ru-RU)" },
  { value: "ja-JP", label: "日本語 (ja-JP)" },
  { value: "ko-KR", label: "한국어 (ko-KR)" },
  { value: "zh-CN", label: "中文 (简体) (zh-CN)" },
  { value: "ar-SA", label: "العربية (ar-SA)" },
];



// ── Subtitle Settings ─────────────────────────────────────────────────────────


// ── Notifications Section ─────────────────────────────────────────────────────


// ── Section Group Header ──────────────────────────────────────────────────────
function SectionGroupHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 32, marginTop: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: subtitle ? 6 : 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            letterSpacing: 2,
            color: "var(--red)",
            textTransform: "uppercase",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{ flex: 1, height: 1, background: "rgba(229,9,20,0.18)" }}
        />
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ height: 1, background: "var(--border)", marginBottom: 40 }} />
  );
}

// ── Search & Nav Bar ──────────────────────────────────────────────────────────
const SUPPORTS_HIGHLIGHT =
  typeof CSS !== "undefined" && typeof CSS.highlights !== "undefined";
const SECTION_NAV = [
  {
    id: "updates",
    label: "Updates & API",
    icon: "↑",
    keywords: [
      "update",
      "version",
      "tmdb",
      "api",
      "token",
      "key",
      "check",
      "startup",
      "auto",
      "app",
      "language",
      "metadata",
      "locale",
      "german",
      "french",
      "spanish",
    ],
  },
  {
    id: "content",
    label: "Age Rating",
    icon: "🔞",
    keywords: [
      "age",
      "rating",
      "parental",
      "content",
      "country",
      "restriction",
      "pg",
      "fsk",
      "adults",
    ],
  },
  {
    id: "playback",
    label: "Playback",
    icon: "▶",
    keywords: [
      "invidious",
      "trailer",
      "youtube",
      "threshold",
      "watched",
      "playback",
      "seconds",
      "mark",
      "auto-watched",
      "intro",
      "skip",
      "aniskip",
      "anime",
      "outro",
    ],
  },
  {
    id: "subtitles",
    label: "Subtitles",
    icon: "CC",
    keywords: [
      "subtitle",
      "subdl",
      "wyzie",
      "language",
      "caption",
      "srt",
      "download",
      "cc",
    ],
  },
  {
    id: "downloads",
    label: "Downloads",
    icon: "⬇",
    keywords: [
      "download",
      "folder",
      "path",
      "save",
      "video",
      "movies",
      "files",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "🔔",
    keywords: [
      "notification",
      "notify",
      "alert",
      "desktop",
      "episode",
      "download",
      "watchlist",
      "new episode",
      "release",
    ],
  },
  {
    id: "interface",
    label: "Interface",
    icon: "✦",
    keywords: [
      "home",
      "layout",
      "start page",
      "appearance",
      "accent",
      "colour",
      "color",
      "font",
      "compact",
      "animation",
      "theme",
      "rows",
      "hero",
    ],
  },
  {
    id: "library",
    label: "Library",
    icon: "📚",
    keywords: [
      "library",
      "watchlist",
      "sort",
      "history",
      "privacy",
      "watch history",
      "continue",
    ],
  },
  {
    id: "backup",
    label: "Backup",
    icon: "💾",
    keywords: [
      "backup",
      "restore",
      "export",
      "import",
      "scheduled",
      "json",
      "backup file",
    ],
  },
  {
    id: "storage",
    label: "Storage & Data",
    icon: "🗄",
    keywords: [
      "storage",
      "cache",
      "clear",
      "reset",
      "delete",
      "data",
      "wipe",
      "progress",
      "factory",
    ],
  },
];

function SettingsTopBar({ sectionRefs, contentRef }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const matchRanges = useRef([]);
  const currentMatchRef = useRef(0);
  const matchCountRef = useRef(0);
  const inputRef = useRef(null);
  const navRef = useRef(null);
  const searchBarRef = useRef(null);
  const debounceTimer = useRef(null);
  const rafHandle = useRef(null);

  const clearHighlights = () => {
    if (SUPPORTS_HIGHLIGHT) {
      CSS.highlights.delete("settings-search");
      CSS.highlights.delete("settings-search-active");
    }
    matchRanges.current = [];
    matchCountRef.current = 0;
    currentMatchRef.current = 0;
    setMatchCount(0);
    setCurrentMatch(0);
  };

  const scrollToRange = (range) => {
    if (!range) return;
    if (rafHandle.current) cancelAnimationFrame(rafHandle.current);
    rafHandle.current = requestAnimationFrame(() => {
      rafHandle.current = null;
      try {
        const el = range.startContainer.parentElement;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (_) {}
    });
  };

  const setActiveMatch = (idx) => {
    const range = matchRanges.current[idx];
    if (!range) return;
    if (SUPPORTS_HIGHLIGHT) {
      CSS.highlights.set("settings-search-active", new Highlight(range));
    }
    scrollToRange(range);
    currentMatchRef.current = idx + 1;
    setCurrentMatch(idx + 1);
  };

  const runSearch = (searchQuery) => {
    clearHighlights();
    if (!contentRef?.current || !searchQuery.trim()) return;

    const str = searchQuery.toLowerCase();
    const ranges = [];
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.toLowerCase();
      let idx = 0;
      while ((idx = text.indexOf(str, idx)) !== -1) {
        const range = new Range();
        range.setStart(node, idx);
        range.setEnd(node, idx + searchQuery.length);
        ranges.push(range);
        idx += str.length;
      }
    }

    matchRanges.current = ranges;
    matchCountRef.current = ranges.length;
    setMatchCount(ranges.length);

    if (ranges.length > 0) {
      if (SUPPORTS_HIGHLIGHT) {
        const hl = new Highlight();
        for (const r of ranges) hl.add(r);
        CSS.highlights.set("settings-search", hl);
      }
      setActiveMatch(0);
    }
  };

  const findMatches = (searchQuery) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      runSearch(searchQuery);
    }, 80);
  };

  const goNext = () => {
    const total = matchCountRef.current;
    if (total === 0) return;
    const next = currentMatchRef.current < total ? currentMatchRef.current : 0;
    setActiveMatch(next);
  };

  const goPrev = () => {
    const total = matchCountRef.current;
    if (total === 0) return;
    const prev =
      currentMatchRef.current > 1 ? currentMatchRef.current - 2 : total - 1;
    setActiveMatch(prev);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    clearHighlights();
  };

  // Focus on open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    }
  }, [searchOpen]);

  // Clean up on unmount
  useEffect(
    () => () => {
      clearHighlights();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (rafHandle.current) cancelAnimationFrame(rafHandle.current);
    },
    [],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        closeSearch();
        setNavOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        if (e.shiftKey) goPrev();
        else goNext();
        return;
      }
      if (searchOpen && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) goPrev();
        else goNext();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen]);

  // Close nav on outside click
  useEffect(() => {
    if (!navOpen) return;
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target))
        setNavOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [navOpen]);

  // Clear highlights + close search when clicking outside the search bar
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        clearHighlights();
        setSearchOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  const scrollTo = (id) => {
    const el = sectionRefs[id]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setNavOpen(false);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    findMatches(val);
  };

  const noMatch = query.trim().length > 0 && matchCount === 0;
  const hasQuery = query.trim().length > 0;

  const navBtnStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text2)",
    display: "flex",
    alignItems: "center",
    padding: "4px 5px",
    borderRadius: 5,
    transition: "background 0.1s",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--bg, #141414)",
        borderBottom: "1px solid var(--border)",
        padding: "0 48px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
        }}
      >
        {/* ── Search area ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          {searchOpen ? (
            <div
              ref={searchBarRef}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
                maxWidth: 540,
                background: "var(--surface2)",
                border: `1px solid ${noMatch ? "#ff3860" : "var(--red)"}`,
                borderRadius: 8,
                padding: "5px 8px 5px 12px",
                boxShadow: `0 0 0 3px ${noMatch ? "rgba(255,56,96,0.1)" : "rgba(229,9,20,0.1)"}`,
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            >
              {/* Search icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text3)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              {/* Input */}
              <input
                ref={inputRef}
                value={query}
                onChange={handleQueryChange}
                placeholder="Search on this page…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: noMatch ? "#ff3860" : "var(--text)",
                  fontFamily: "var(--font-body)",
                  minWidth: 0,
                }}
              />

              {/* Match counter */}
              {hasQuery && (
                <span
                  style={{
                    fontSize: 12,
                    color: noMatch ? "#ff3860" : "var(--text3)",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    padding: "0 8px",
                    borderLeft: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    margin: "0 2px",
                    flexShrink: 0,
                  }}
                >
                  {noMatch ? "No results" : `${currentMatch} / ${matchCount}`}
                </span>
              )}

              {/* Prev button */}
              {matchCount > 0 && (
                <button
                  onClick={goPrev}
                  title="Previous match (Shift+Enter)"
                  style={navBtnStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
              )}

              {/* Next button */}
              {matchCount > 0 && (
                <button
                  onClick={goNext}
                  title="Next match (Enter)"
                  style={navBtnStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}

              {/* Divider + Clear */}
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    clearHighlights();
                    inputRef.current?.focus();
                  }}
                  title="Clear search"
                  style={{ ...navBtnStyle, color: "var(--text3)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              {/* Esc button */}
              <button
                onClick={closeSearch}
                title="Close (Esc)"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text3)",
                  fontSize: 11,
                  padding: "3px 7px",
                  borderRadius: 4,
                  fontFamily: "var(--font-body)",
                  flexShrink: 0,
                  letterSpacing: 0.3,
                }}
              >
                Esc
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                color: "var(--text3)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--surface2)")
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search settings…
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text3)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontFamily: "monospace",
                  letterSpacing: 0.5,
                }}
              >
                ⌘K
              </span>
            </button>
          )}
        </div>

        {/* ── Jump to section dropdown ── */}
        <div ref={navRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setNavOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: navOpen ? "var(--surface3)" : "var(--surface2)",
              border: `1px solid ${navOpen ? "var(--red)" : "var(--border)"}`,
              boxShadow: navOpen ? "0 0 0 3px rgba(229,9,20,0.1)" : "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--text)",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "var(--font-body)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="3" cy="6" r="1" fill="currentColor" />
              <circle cx="3" cy="12" r="1" fill="currentColor" />
              <circle cx="3" cy="18" r="1" fill="currentColor" />
            </svg>
            Jump to Section
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text3)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                transform: navOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {navOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 200,
                background: "var(--surface3)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
                minWidth: 230,
                padding: 6,
              }}
            >
              {SECTION_NAV.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={() => scrollTo(s.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: 13,
                    color: "var(--text)",
                    cursor: "pointer",
                    transition: "background 0.1s",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.07)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      width: 22,
                      textAlign: "center",
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </span>
                  <span style={{ flex: 1 }}>{s.label}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text3)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage({
  apiKey,
  onChangeApiKey,
  initialSection,
}) {
  const [downloadPath, setDownloadPath] = useState(
    () => storage.get(STORAGE_KEYS.DOWNLOAD_PATH) || "",
  );
  const [watchedThreshold, setWatchedThreshold] = useState(
    () => storage.get(STORAGE_KEYS.WATCHED_THRESHOLD) ?? 20,
  );
  const [introSkipMode, setIntroSkipMode] = useState(
    () => storage.get(STORAGE_KEYS.INTRO_SKIP_MODE) || "off",
  );
  const [autoplayNextEnabled, setAutoplayNextEnabled] = useState(
    () => storage.get(STORAGE_KEYS.AUTOPLAY_NEXT_ENABLED) ?? true,
  );
  const [autoplayNextDuration, setAutoplayNextDuration] = useState(
    () => storage.get(STORAGE_KEYS.AUTOPLAY_NEXT_DURATION) ?? 5,
  );
  const [autoplayNextLayout, setAutoplayNextLayout] = useState(
    () => storage.get(STORAGE_KEYS.AUTOPLAY_NEXT_LAYOUT) || "right",
  );
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetHovered, setResetHovered] = useState(false);
  const [showProgressConfirm, setShowProgressConfirm] = useState(false);
  const [showDeleteDlConfirm, setShowDeleteDlConfirm] = useState(false);

  // ── Section refs for navigation ────────────────────────────────────────────
  const secUpdates = useRef(null);
  const secContent = useRef(null);
  const secPlayback = useRef(null);
  const secSubtitles = useRef(null);
  const secDownloads = useRef(null);
  const secNotifications = useRef(null);
  const secInterface = useRef(null);
  const secLibrary = useRef(null);
  const secBackup = useRef(null);
  const secStorage = useRef(null);

  const sectionRefs = {
    updates: secUpdates,
    content: secContent,
    playback: secPlayback,
    subtitles: secSubtitles,
    downloads: secDownloads,
    notifications: secNotifications,
    interface: secInterface,
    library: secLibrary,
    backup: secBackup,
    storage: secStorage,
  };

  // Ref for find-in-page search scope
  const contentRef = useRef(null);

  // Scroll to initial section if provided (e.g. when navigating from a modal)
  useEffect(() => {
    if (!initialSection) return;
    const el = sectionRefs[initialSection]?.current;
    if (!el) return;
    // Small delay so layout is complete before scrolling
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, []);

  // Age Rating
  const [ratingCountry, setRatingCountry] = useState(
    () => storage.get(STORAGE_KEYS.RATING_COUNTRY) || "US",
  );
  const [ageLimit, setAgeLimit] = useState(() => {
    const v = storage.get(STORAGE_KEYS.AGE_LIMIT);
    return v === null || v === undefined ? "" : String(v);
  });
  const [ageSaved, setAgeSaved] = useState(false);

  const saveAgeSettings = () => {
    storage.set(STORAGE_KEYS.RATING_COUNTRY, ratingCountry);
    if (ageLimit === "" || ageLimit === null) {
      storage.remove(STORAGE_KEYS.AGE_LIMIT);
    } else {
      storage.set(STORAGE_KEYS.AGE_LIMIT, Number(ageLimit));
    }
    setAgeSaved(true);
    setTimeout(() => setAgeSaved(false), 2000);
  };

  // Invidious
  const [invidiousBase, setInvidiousBase] = useState(
    () => storage.get(STORAGE_KEYS.INVIDIOUS_BASE) || DEFAULT_INVIDIOUS_BASE,
  );
  const [invidiousStatus, setInvidiousStatus] = useState(null); // null | { ok: bool, msg: string }
  const [invidiousChecking, setInvidiousChecking] = useState(false);
  const [invidiousSaved, setInvidiousSaved] = useState(false);

  const checkInvidious = async (baseUrl) => {
    const clean = (baseUrl || "").trim().replace(/\/$/, "");
    if (!clean) {
      setInvidiousStatus({ ok: false, msg: "Please enter a URL first." });
      return;
    }
    setInvidiousChecking(true);
    setInvidiousStatus(null);
    try {
      const url = `${clean}/api/v1/stats`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        setInvidiousStatus({
          ok: true,
          msg: "Instance reachable and responding.",
        });
      } else {
        setInvidiousStatus({
          ok: false,
          msg: `Server responded with status ${res.status}.`,
        });
      }
    } catch (e) {
      setInvidiousStatus({
        ok: false,
        msg: "Could not reach instance. Check the URL or try another.",
      });
    } finally {
      setInvidiousChecking(false);
    }
  };

  const saveInvidiousBase = () => {
    const clean = (invidiousBase || "").trim().replace(/\/$/, "");
    storage.set(STORAGE_KEYS.INVIDIOUS_BASE, clean || DEFAULT_INVIDIOUS_BASE);
    setInvidiousBase(clean || DEFAULT_INVIDIOUS_BASE);
    setInvidiousSaved(true);
    setTimeout(() => setInvidiousSaved(false), 2000);
  };

  // Storage sizes - null = loading, -1 = unavailable, ≥0 = real value
  const [sizes, setSizes] = useState({ cache: null, downloads: null });

  useEffect(() => {
    if (typeof window === "undefined" || !window.electron) {
      setSizes({ cache: -1, downloads: -1 });
      return;
    }
    (async () => {
      try {
        const [cacheRes, downloadsRes] = await Promise.all([
          window.electron.getCacheSize?.() ?? null,
          window.electron.getDownloadsSize?.() ?? null,
        ]);
        setSizes({
          cache: cacheRes?.bytes ?? -1,
          downloads: downloadsRes?.bytes ?? -1,
        });
      } catch {
        setSizes({ cache: -1, downloads: -1 });
      }
    })();
  }, []);

  
  const handleSavePath = () => {
    storage.set(STORAGE_KEYS.DOWNLOAD_PATH, downloadPath);
    flash();
  };

  const handleSaveThreshold = () => {
    const val = Math.max(1, Math.min(300, Number(watchedThreshold) || 20));
    setWatchedThreshold(val);
    storage.set(STORAGE_KEYS.WATCHED_THRESHOLD, val);
    flash();
  };

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Clean handlers ─────────────────────────────────────────────────────────

  const handleClearCache = async () => {
    await clearAppCaches();
    setSizes((prev) => ({ ...prev, cache: 0 }));
    return { msg: "✓ Cache cleared successfully" };
  };

  const handleClearWatchProgress = async () => {
    storage.remove(STORAGE_KEYS.WATCH_PROGRESS);
    storage.remove(STORAGE_KEYS.HISTORY);
    storage.remove(STORAGE_KEYS.WATCHED);
    setTimeout(() => window.location.reload(), 800);
    return { msg: "✓ Watch data cleared" };
  };

  const handleDeleteAllDownloads = async () => {
    let msg = "✓ All downloads removed";
    setSizes((prev) => ({ ...prev, downloads: 0 }));
    storage.remove(STORAGE_KEYS.LOCAL_FILES);
    return { msg };
  };

  const handleResetApp = async () => {
    setShowResetConfirm(false);
    storage.clearAll();
    // Clear non-prefixed localStorage caches
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("dlDur_")) localStorage.removeItem(key);
    }
    window.location.reload();
  };

  return (
    <>
      {showProgressConfirm && (
        <ConfirmDialog
          title="CLEAR WATCH PROGRESS?"
          description="This will permanently delete all watch history, continue-watching progress, and watched/completed markings for all movies and series."
          confirmLabel="Yes, Clear Everything"
          onConfirm={async () => {
            setShowProgressConfirm(false);
            await handleClearWatchProgress();
            window.__progressConfirmResolve?.({ msg: "✓ Watch data cleared" });
            window.__progressConfirmResolve = null;
          }}
          onCancel={() => {
            setShowProgressConfirm(false);
            window.__progressConfirmResolve?.({ cancelled: true });
            window.__progressConfirmResolve = null;
          }}
        />
      )}
      {showDeleteDlConfirm && (
        <ConfirmDialog
          title="DELETE ALL DOWNLOADS?"
          description="This will permanently delete all video files downloaded through Streambert and remove them from the download list."
          confirmLabel="Yes, Delete All"
          onConfirm={async () => {
            setShowDeleteDlConfirm(false);
            const result = await handleDeleteAllDownloads();
            window.__deleteDlConfirmResolve?.(result);
            window.__deleteDlConfirmResolve = null;
          }}
          onCancel={() => {
            setShowDeleteDlConfirm(false);
            window.__deleteDlConfirmResolve?.({ cancelled: true });
            window.__deleteDlConfirmResolve = null;
          }}
        />
      )}
      {showResetConfirm && (
        <ResetConfirmDialog
          onConfirm={handleResetApp}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* ── Sticky search & navigation bar ── */}
      <SettingsTopBar sectionRefs={sectionRefs} contentRef={contentRef} />

      <div
        ref={contentRef}
        className="fade-in"
        style={{ padding: "40px 48px 80px" }}
      >
        {/* Page title */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 48,
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          SETTINGS
        </div>
        <div style={{ color: "var(--text3)", fontSize: 14, marginBottom: 48 }}>
          App configuration for Streambert
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GROUP: GENERAL                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div ref={secUpdates} style={{ scrollMarginTop: 80 }}>
          <SectionGroupHeader
            title="General"
            subtitle="App version, updates, API credentials and Languages"
          />

          {/* Version & Updates */}
          <VersionSection />

          <Divider />

          {/* TMDB API Token */}
          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">TMDB Read Access Token</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Used to fetch movie and TV metadata, posters, ratings, and cast
              info from The Movie Database.
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <code
                style={{
                  fontSize: 13,
                  color: "var(--text2)",
                  background: "var(--surface2)",
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              >
                {apiKey ? apiKey.slice(0, 8) + "••••••••••••••••" : "(not set)"}
              </code>
              <button className="btn btn-ghost" onClick={onChangeApiKey}>
                Change API Token
              </button>
            </div>
          </div>

          <Divider />

          <TmdbLanguageSection />
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GROUP: CONTENT                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div ref={secContent} style={{ scrollMarginTop: 80 }}>
          <SectionGroupHeader
            title="Content"
            subtitle="Parental controls and content filtering by age rating"
          />

          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">
              Age Rating &amp; Parental Controls
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Set a maximum age rating. Content rated above this age will still
              be visible but{" "}
              <strong style={{ color: "var(--text)" }}>
                you won't be able to play it.
              </strong>{" "}
              Set to <em>No restriction</em> to disable this feature entirely.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text2)",
                    marginBottom: 8,
                  }}
                >
                  Rating Country
                </div>
                <SettingsSelect
                  value={ratingCountry}
                  onChange={(v) => setRatingCountry(v)}
                  options={RATING_COUNTRIES.map((c) => ({
                    value: c.code,
                    label: c.label,
                  }))}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text2)",
                    marginBottom: 8,
                  }}
                >
                  Maximum Allowed Age Rating
                </div>
                <SettingsSelect
                  value={ageLimit}
                  onChange={(v) => setAgeLimit(v)}
                  options={AGE_LIMIT_OPTIONS}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="btn btn-primary" onClick={saveAgeSettings}>
                  Save
                </button>
                {ageSaved && (
                  <span style={{ fontSize: 13, color: "#48c774" }}>
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GROUP: PLAYBACK                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div ref={secPlayback} style={{ scrollMarginTop: 80 }}>
          <SectionGroupHeader
            title="Playback"
            subtitle="Trailer source and auto-watched behavior"
          />

          {/* Invidious */}
          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">Invidious Instance</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Trailers are played via{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                Invidious
              </span>
              , a privacy-friendly YouTube frontend. Your configured instance is
              tried first; if it fails, the app automatically falls back through
              a list of known working instances. The default is{" "}
              <code style={{ fontSize: 12 }}>{DEFAULT_INVIDIOUS_BASE}</code>.
              The instance must have its API enabled (
              <code style={{ fontSize: 12 }}>/api/v1/stats</code> reachable).
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                className="apikey-input"
                style={{ flex: 1, minWidth: 260, marginBottom: 0 }}
                placeholder={DEFAULT_INVIDIOUS_BASE}
                value={invidiousBase}
                onChange={(e) => {
                  setInvidiousBase(e.target.value);
                  setInvidiousStatus(null);
                }}
              />
              <button
                className="btn btn-ghost"
                disabled={invidiousChecking}
                onClick={() => checkInvidious(invidiousBase)}
                style={{ opacity: invidiousChecking ? 0.5 : 1 }}
              >
                {invidiousChecking ? "Checking…" : "Check"}
              </button>
              <button className="btn btn-primary" onClick={saveInvidiousBase}>
                Save
              </button>
            </div>

            {invidiousStatus && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: invidiousStatus.ok ? "#48c774" : "#ff3860",
                    boxShadow: invidiousStatus.ok
                      ? "0 0 6px rgba(72,199,116,0.6)"
                      : "0 0 6px rgba(255,56,96,0.6)",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: invidiousStatus.ok ? "#48c774" : "#ff3860",
                  }}
                >
                  {invidiousStatus.msg}
                </span>
              </div>
            )}

            {invidiousSaved && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#48c774" }}>
                ✓ Saved
              </div>
            )}
          </div>

          <Divider />

          {/* Auto-Watched Threshold */}
          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">Auto-Watched Threshold</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              A movie or episode is automatically marked as{" "}
              <span style={{ color: "#48c774", fontWeight: 600 }}>
                Watched ✓
              </span>{" "}
              when the remaining time drops to this value or below. Set between
              1 and 300 seconds.
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  max={300}
                  className="apikey-input"
                  style={{ width: 90, marginBottom: 0 }}
                  value={watchedThreshold}
                  onChange={(e) => setWatchedThreshold(e.target.value)}
                />
                <span style={{ fontSize: 14, color: "var(--text2)" }}>
                  seconds
                </span>
              </div>
              <button className="btn btn-primary" onClick={handleSaveThreshold}>
                Save
              </button>
            </div>
            {saved && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#48c774" }}>
                ✓ Saved
              </div>
            )}
          </div>

          <Divider />

          {/* Autoplay Next Episode */}
          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">Autoplay Next Episode</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Configure how the player behaves when an episode finishes.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Enable/Disable Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Toggle
                  value={autoplayNextEnabled}
                  onChange={(val) => {
                    setAutoplayNextEnabled(val);
                    storage.set(STORAGE_KEYS.AUTOPLAY_NEXT_ENABLED, val);
                    flash();
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    Enable Autoplay Next
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text3)",
                      marginTop: 2,
                    }}
                  >
                    Automatically play the next episode when the current one
                    ends.
                  </div>
                </div>
              </div>

              {autoplayNextEnabled && (
                <>
                  {/* Duration input */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text2)",
                      }}
                    >
                      Countdown Duration
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text3)",
                        marginBottom: 4,
                      }}
                    >
                      Number of seconds to display the countdown. Set to 0 to
                      only show the buttons and not autoplay automatically.
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <input
                        type="number"
                        min={0}
                        max={60}
                        className="apikey-input"
                        style={{ width: 90, marginBottom: 0 }}
                        value={autoplayNextDuration}
                        onChange={(e) =>
                          setAutoplayNextDuration(e.target.value)
                        }
                        onBlur={() => {
                          const num = Math.max(
                            0,
                            Math.min(
                              60,
                              parseInt(autoplayNextDuration, 10) || 0,
                            ),
                          );
                          setAutoplayNextDuration(num);
                          storage.set(STORAGE_KEYS.AUTOPLAY_NEXT_DURATION, num);
                          flash();
                        }}
                      />
                      <span style={{ fontSize: 14, color: "var(--text2)" }}>
                        seconds
                      </span>
                    </div>
                  </div>

                  {/* Overlay Layout selection */}
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text2)",
                        marginBottom: 8,
                      }}
                    >
                      Overlay Position
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text3)",
                        marginBottom: 12,
                      }}
                    >
                      Choose which side of the player the next episode thumbnail
                      and details are shown.
                    </div>
                    <SettingsSelect
                      value={autoplayNextLayout}
                      onChange={(val) => {
                        setAutoplayNextLayout(val);
                        storage.set(STORAGE_KEYS.AUTOPLAY_NEXT_LAYOUT, val);
                        flash();
                      }}
                      options={[
                        { value: "left", label: "Left Side" },
                        { value: "right", label: "Right Side" },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <Divider />

          {/* Intro Skip */}
          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">Anime Intro Skip</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Uses{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                AniSkip
              </span>{" "}
              to detect and skip opening/ending segments. Only active for animes
              and when using{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                AllManga
              </span>{" "}
              as source.
            </div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "0 16px",
              }}
            >
              {[
                {
                  value: "off",
                  label: "Off",
                  desc: "Intro skip is disabled.",
                },
                {
                  value: "auto",
                  label: "Auto Skip",
                  desc: "Automatically jumps past the intro/outro when reached.",
                },
                {
                  value: "manual",
                  label: "Manual Skip",
                  desc: 'Shows a "Skip Intro" button at the bottom of the player.',
                },
              ].map(({ value, label, desc }, i, arr) => (
                <div
                  key={value}
                  onClick={() => {
                    setIntroSkipMode(value);
                    storage.set(STORAGE_KEYS.INTRO_SKIP_MODE, value);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "16px 0",
                    borderBottom:
                      i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {/* Radio dot */}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${introSkipMode === value ? "var(--red)" : "var(--border)"}`,
                      background:
                        introSkipMode === value ? "var(--red)" : "transparent",
                      flexShrink: 0,
                      marginTop: 1,
                      boxShadow:
                        introSkipMode === value
                          ? "0 0 0 3px rgba(229,9,20,0.18)"
                          : "none",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {introSkipMode === value && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#fff",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text3)",
                        marginTop: 3,
                        lineHeight: 1.5,
                      }}
                    >
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GROUP: SUBTITLES                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div ref={secSubtitles} style={{ scrollMarginTop: 80 }}>
          <SectionGroupHeader
            title="Subtitles"
            subtitle="Subtitle download source, preferred language, and API key"
          />
          <SubtitleSettingsSection />
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GROUP: DOWNLOADS                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div ref={secDownloads} style={{ scrollMarginTop: 80 }}>
          <SectionGroupHeader
            title="Downloads"
            subtitle="Where downloaded video files are saved on disk"
          />

          <div style={{ marginBottom: 40 }}>
            <div className="settings-section-title">Download Folder</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text3)",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Downloaded videos will be saved here. Make sure the folder exists
              and Streambert has write access to it.
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                className="apikey-input"
                style={{ flex: 1, minWidth: 260, marginBottom: 0 }}
                placeholder="/home/you/Movies"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleSavePath}>
                Save
              </button>
            </div>

            <div style={{ height: 1, background: "var(--border)" }} />

            {/* Delete Downloads */}
            <div style={{ padding: "22px 24px" }}>
              <CleanRow
                title="Delete All Downloads"
                description="Permanently deletes all video files that were downloaded through Streambert and removes them from the download list. Only files downloaded through the app will be deleted, nothing else in your folder is touched."
                buttonLabel="Delete All"
                onAction={() =>
                  new Promise((resolve) => {
                    setShowDeleteDlConfirm(true);
                    window.__deleteDlConfirmResolve = resolve;
                  })
                }
                sizeLabel={formatBytes(sizes.downloads)}
                danger
              />
            </div>

            <div style={{ height: 1, background: "var(--border)" }} />

            {/* Full Reset */}
            <div
              style={{
                padding: "22px 24px",
                background: "rgba(229,9,20,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 24,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    Reset App
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: "var(--red)",
                        background: "rgba(229,9,20,0.12)",
                        border: "1px solid rgba(229,9,20,0.25)",
                        padding: "2px 7px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      Irreversible
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text3)",
                      lineHeight: 1.6,
                    }}
                  >
                    Completely resets Streambert to factory defaults, clears all
                    settings, API Token, saved library, watch history/progress,
                    and all cached data. Your downloaded video files will not be
                    touched.
                  </div>
                </div>
                <div style={{ flexShrink: 0, paddingTop: 2 }}>
                  <button
                    className="btn"
                    onClick={() => setShowResetConfirm(true)}
                    onMouseEnter={() => setResetHovered(true)}
                    onMouseLeave={() => setResetHovered(false)}
                    style={{
                      color: resetHovered ? "#fff" : "var(--red)",
                      background: resetHovered
                        ? "rgba(229,9,20,0.85)"
                        : "rgba(229,9,20,0.08)",
                      border: resetHovered
                        ? "1px solid transparent"
                        : "1px solid rgba(229,9,20,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    Reset App
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
