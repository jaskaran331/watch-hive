import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Check, ChevronDown, Download, FolderOpen, RefreshCcw, 
  Save, Search, Shield, Trash2, X, Play, Image as ImageIcon,
  HardDrive, Clock, Bell, Info, Globe, Type
} from "lucide-react";
import { secureStorage as storage, STORAGE_KEYS } from "../../utils/storage";
import { PLAYER_SOURCES } from "../../utils/api";

export function LibraryPrivacySection() {
  const [sort, setSort] = useState(
    () => storage.get(STORAGE_KEYS.LIBRARY_SORT) || "manual",
  );
  const [historyEnabled, setHistoryEnabled] = useState(() => {
    const v = storage.get(STORAGE_KEYS.HISTORY_ENABLED);
    return v === 0 || v === false ? false : true;
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    storage.set(STORAGE_KEYS.LIBRARY_SORT, sort);
    storage.set(STORAGE_KEYS.HISTORY_ENABLED, historyEnabled ? 1 : 0);
    window.dispatchEvent(
      new CustomEvent("streambert:library-sort-changed", { detail: sort }),
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const SORT_OPTIONS = [
    { value: "manual", label: "Custom order" },
    { value: "title", label: "Title A-Z" },
    { value: "rating", label: "Top rated" },
    { value: "year", label: "Newest first" },
  ];

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Library & Privacy</div>

      {/* Watchlist Sort */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text2)",
            marginBottom: 8,
          }}
        >
          Watchlist sort order
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text3)",
            marginBottom: 12,
            lineHeight: 1.6,
          }}
        >
          How titles in your watchlist are sorted. "Custom order" keeps your
          drag-and-drop arrangement.
        </div>
        <SettingsSelect
          value={sort}
          onChange={(v) => setSort(v)}
          options={SORT_OPTIONS}
        />
      </div>

      {/* Watch History Toggle */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle value={historyEnabled} onChange={setHistoryEnabled} />
          <div>
            <div
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
            >
              Record watch history
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              When off, nothing you watch will be added to history or "Continue
              Watching".
            </div>
          </div>
        </div>
        {!historyEnabled && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "var(--red)",
              background: "rgba(229,9,20,0.08)",
              border: "1px solid rgba(229,9,20,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            ⚠ Watch history is disabled. Progress tracking and "Continue
            Watching" will not work.
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#48c774" }}>✓ Saved</span>
        )}
      </div>
    </div>
  );
}

export function TmdbLanguageSection() {
  const [lang, setLang] = useState(
    () => storage.get(STORAGE_KEYS.TMDB_LANG) || "en-US",
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    storage.set(STORAGE_KEYS.TMDB_LANG, lang);
    // Clear in-memory cache
    clearTmdbCache();
    // Notify App.jsx to re-fetch trending data immediately.
    window.dispatchEvent(new CustomEvent("streambert:tmdb-lang-changed"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Metadata Language</div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text3)",
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Language used when fetching titles, descriptions, and other metadata
        from TMDB. Changing this clears the metadata cache so updated content
        loads immediately.
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <SettingsSelect
          value={lang}
          onChange={(v) => setLang(v)}
          options={TMDB_LANGUAGES}
        />
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#48c774" }}>
            ✓ Saved, cache cleared
          </span>
        )}
      </div>
    </div>
  );
}

