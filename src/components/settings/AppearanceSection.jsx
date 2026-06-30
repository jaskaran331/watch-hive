import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Check, ChevronDown, Download, FolderOpen, RefreshCcw, 
  Save, Search, Shield, Trash2, X, Play, Image as ImageIcon,
  HardDrive, Clock, Bell, Info, Globe, Type
} from "lucide-react";
import { secureStorage as storage, STORAGE_KEYS } from "../../utils/storage";
import { PLAYER_SOURCES } from "../../utils/api";

export function HomeLayoutSection() {
  const [order, setOrder] = useState(() => {
    const { order: o } = loadHomeLayout();
    return o;
  });
  const [visible, setVisible] = useState(() => {
    const { visible: v } = loadHomeLayout();
    return v;
  });
  const [viewMode, setViewMode] = useState(() => loadHomeViewMode());
  const [saved, setSaved] = useState(false);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const handleDragStart = (idx) => {
    dragItem.current = idx;
  };
  const handleDragEnter = (idx) => {
    dragOver.current = idx;
  };
  const handleDragEnd = () => {
    const newOrder = [...order];
    const dragged = newOrder.splice(dragItem.current, 1)[0];
    newOrder.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    setOrder(newOrder);
  };

  const toggleVisible = (id) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    storage.set(STORAGE_KEYS.HOME_ROW_ORDER, order);
    storage.set(STORAGE_KEYS.HOME_ROW_VISIBLE, visible);
    saveHomeViewMode(viewMode);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rowLabels = Object.fromEntries(HOME_ROWS.map((r) => [r.id, r.label]));

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Home Page Layout</div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text3)",
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Choose which rows appear on the Home page and drag to reorder them. The
        hero banner is always shown at the top.
      </div>

      {/* ── View mode selector ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text2)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Row display style
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            {
              value: "carousel",
              label: "Carousel",
              desc: "Scrollable spotlight with featured poster",
            },
            {
              value: "list",
              label: "⊞ Grid",
              desc: "Compact grid of all items",
            },
          ].map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              style={{
                flex: 1,
                maxWidth: 220,
                padding: "10px 14px",
                borderRadius: 8,
                border: `2px solid ${viewMode === value ? "var(--red)" : "var(--border)"}`,
                background:
                  viewMode === value
                    ? "color-mix(in srgb, var(--red) 12%, var(--surface))"
                    : "var(--surface)",
                color: viewMode === value ? "var(--text)" : "var(--text2)",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
              <div
                style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}
              >
                {desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 480,
        }}
      >
        {order.map((id, idx) => (
          <div
            key={id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 14px",
              cursor: "grab",
              opacity: visible[id] ? 1 : 0.45,
              transition: "opacity 0.2s",
              userSelect: "none",
            }}
          >
            {/* Drag handle */}
            <span
              style={{
                color: "var(--text3)",
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ⠿
            </span>

            {/* Label */}
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              {rowLabels[id] || id}
            </span>

            {/* Toggle */}
            <Toggle
              value={visible[id]}
              onChange={() => toggleVisible(id)}
              title={visible[id] ? "Hide row" : "Show row"}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button className="btn btn-primary" onClick={handleSave}>
          Save Layout
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#48c774" }}>✓ Saved</span>
        )}
      </div>
    </div>
  );
}

export function AppearanceSection() {
  const [accent, setAccent] = useState(
    () => storage.get(STORAGE_KEYS.ACCENT_COLOR) || "red",
  );
  const [fontSize, setFontSize] = useState(
    () => storage.get(STORAGE_KEYS.FONT_SIZE) || "normal",
  );
  const [compact, setCompact] = useState(
    () => !!storage.get(STORAGE_KEYS.COMPACT_MODE),
  );
  const [noAnim, setNoAnim] = useState(
    () => !!storage.get(STORAGE_KEYS.REDUCE_ANIMATIONS),
  );
  const [accentInPlayer, setAccentInPlayer] = useState(
    () => storage.get(STORAGE_KEYS.ACCENT_IN_PLAYER) !== false,
  );
  const [theme, setTheme] = useState(
    () => storage.get(STORAGE_KEYS.THEME) || "dark",
  );
  const [customVars, setCustomVars] = useState(
    () =>
      storage.get(STORAGE_KEYS.CUSTOM_THEME_VARS) || { ...DEFAULT_CUSTOM_VARS },
  );
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [saved, setSaved] = useState(false);

  // Remember the committed (saved) values to revert on unmount if unsaved
  const committedRef = useRef({
    accent: storage.get(STORAGE_KEYS.ACCENT_COLOR) || "red",
    theme: storage.get(STORAGE_KEYS.THEME) || "dark",
    customVars: storage.get(STORAGE_KEYS.CUSTOM_THEME_VARS) || {
      ...DEFAULT_CUSTOM_VARS,
    },
  });
  const savedRef = useRef(false);

  // Revert live preview when leaving without saving
  useEffect(() => {
    return () => {
      if (!savedRef.current) {
        const { accent, theme, customVars } = committedRef.current;
        applyAccentColor(accent);
        applyTheme(theme, theme === "custom" ? customVars : null);
      }
    };
  }, []);

  const handleThemeSelect = (id) => {
    setTheme(id);
    if (id !== "custom") {
      applyTheme(id);
    } else {
      applyTheme("custom", customVars);
      setShowCustomEditor(true);
    }
  };

  const handleCustomVarChange = (prop, value) => {
    const next = { ...customVars, [prop]: value };
    setCustomVars(next);
    applyTheme("custom", next);
  };

  const handleSave = () => {
    storage.set(STORAGE_KEYS.ACCENT_COLOR, accent);
    storage.set(STORAGE_KEYS.ACCENT_IN_PLAYER, accentInPlayer);
    storage.set(STORAGE_KEYS.FONT_SIZE, fontSize);
    storage.set(STORAGE_KEYS.COMPACT_MODE, compact ? 1 : 0);
    storage.set(STORAGE_KEYS.REDUCE_ANIMATIONS, noAnim ? 1 : 0);
    storage.set(STORAGE_KEYS.THEME, theme);
    if (theme === "custom") {
      storage.set(STORAGE_KEYS.CUSTOM_THEME_VARS, customVars);
    }
    // Apply immediately
    applyAccentColor(accent);
    applyTheme(theme, theme === "custom" ? customVars : null);
    const zoomMap = { sm: 0.85, normal: 1, lg: 1.15 };
    if (window.electron?.setZoomFactor)
      window.electron.setZoomFactor(zoomMap[fontSize] ?? 1);
    document.body.classList.toggle("compact-mode", compact);
    document.body.classList.toggle("no-anim", noAnim);
    // Mark as saved so the cleanup effect doesn't revert
    savedRef.current = true;
    committedRef.current = { accent, theme, customVars };
    // Notify App.jsx so playerSettings prop (accent + lang) is refreshed
    window.dispatchEvent(new CustomEvent("streambert:player-settings-changed"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const CUSTOM_VAR_LABELS = {
    "--bg": "Background",
    "--surface": "Surface",
    "--surface2": "Surface 2",
    "--surface3": "Surface 3",
    "--border": "Border",
    "--text": "Text",
    "--text2": "Text 2",
    "--text3": "Text 3",
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Appearance</div>

      {/* Theme */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text2)",
            marginBottom: 10,
          }}
        >
          Theme
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {THEME_PRESETS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSelect(t.id)}
              title={t.description}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                background:
                  theme === t.id
                    ? "color-mix(in srgb, var(--red) 15%, var(--surface2))"
                    : "var(--surface2)",
                border:
                  theme === t.id
                    ? "1.5px solid var(--red)"
                    : "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                minWidth: 70,
              }}
            >
              {/* Mini preview swatch */}
              <div
                style={{
                  width: 40,
                  height: 28,
                  borderRadius: 4,
                  background:
                    t.id === "custom"
                      ? `linear-gradient(135deg, ${customVars["--bg"]} 50%, ${customVars["--surface2"]} 50%)`
                      : t.vars
                        ? `linear-gradient(135deg, ${t.vars["--bg"]} 50%, ${t.vars["--surface2"]} 50%)`
                        : "var(--surface3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: theme === t.id ? 600 : 400,
                  color: theme === t.id ? "var(--text)" : "var(--text2)",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
          {THEME_PRESETS.find((t) => t.id === theme)?.description}
        </div>
      </div>

      {/* Custom theme editor */}
      {theme === "custom" && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowCustomEditor((v) => !v)}
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "5px 12px", marginBottom: 12 }}
          >
            {showCustomEditor ? "▲ Hide" : "▼ Edit"} custom colours
          </button>
          {showCustomEditor && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
                padding: 16,
                background: "var(--surface2)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            >
              {Object.entries(CUSTOM_VAR_LABELS).map(([prop, label]) => (
                <div
                  key={prop}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="color"
                    value={customVars[prop] || "#000000"}
                    onChange={(e) =>
                      handleCustomVarChange(prop, e.target.value)
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      background: "none",
                      padding: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        fontFamily: "monospace",
                      }}
                    >
                      {customVars[prop]}
                    </div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: "5px 12px" }}
                  onClick={() => {
                    setCustomVars({ ...DEFAULT_CUSTOM_VARS });
                    applyTheme("custom", DEFAULT_CUSTOM_VARS);
                  }}
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accent Colour */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text2)",
            marginBottom: 10,
          }}
        >
          Accent Colour
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setAccent(p.id);
                applyAccentColor(p.id);
              }}
              title={p.label}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: p.color,
                border:
                  accent === p.id
                    ? `3px solid var(--text)`
                    : "3px solid transparent",
                outline: accent === p.id ? `2px solid ${p.color}` : "none",
                outlineOffset: 2,
                cursor: "pointer",
                transition: "transform 0.15s",
                transform: accent === p.id ? "scale(1.15)" : "scale(1)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
          {ACCENT_PRESETS.find((p) => p.id === accent)?.label}, applied to
          buttons, highlights, and indicators.
        </div>
        {/* Accent in streaming player */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 14,
          }}
        >
          <Toggle value={accentInPlayer} onChange={setAccentInPlayer} />
          <div>
            <div
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
            >
              Apply accent colour to streaming player
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              Passes the selected accent colour to the player source (Videasy,
              Vidking). VidSrc does not support colour theming.
            </div>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text2)",
            marginBottom: 10,
          }}
        >
          Font Size
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "sm", label: "Small" },
            { id: "normal", label: "Normal" },
            { id: "lg", label: "Large" },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setFontSize(o.id)}
              className={
                fontSize === o.id ? "btn btn-primary" : "btn btn-ghost"
              }
              style={{
                padding: "7px 18px",
                fontSize: o.id === "sm" ? 12 : o.id === "lg" ? 16 : 14,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle value={compact} onChange={setCompact} />
          <div>
            <div
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
            >
              Compact card grid
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              Shows more titles per row by reducing card size.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle value={noAnim} onChange={setNoAnim} />
          <div>
            <div
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
            >
              Reduce animations
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              Disables transitions and hover effects throughout the app.
            </div>
          </div>
        </div>
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

