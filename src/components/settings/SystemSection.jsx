import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Check, ChevronDown, Download, FolderOpen, RefreshCcw, 
  Save, Search, Shield, Trash2, X, Play, Image as ImageIcon,
  HardDrive, Clock, Bell, Info, Globe, Type
} from "lucide-react";
import { secureStorage as storage, STORAGE_KEYS } from "../../utils/storage";
import { PLAYER_SOURCES } from "../../utils/api";

export function VersionSection() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { latest, current, url, hasUpdate } | { error }
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [autoCheck, setAutoCheck] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.AUTO_CHECK_UPDATES);
    return stored === null || stored === undefined ? true : !!stored;
  });
  const [autoSaved, setAutoSaved] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("0.0.0");
  const [updateSource, setUpdateSource] = useState(
    () => storage.get(STORAGE_KEYS.UPDATE_SOURCE) || DEFAULT_UPDATE_SOURCE,
  );

  useEffect(() => {
    if (window.electron?.getAppVersion) {
      window.electron.getAppVersion().then((v) => {
        setCurrentVersion(v);
      });
    }
  }, []);

  const runCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const r = await checkForUpdatesWithFallback(updateSource);
      setResult(r);
    } catch (e) {
      setResult({
        error:
          e.message ||
          `Could not reach ${UPDATE_SOURCES[updateSource]?.label || "the update server"}.`,
      });
    } finally {
      setChecking(false);
    }
  };

  const changeSource = (src) => {
    setUpdateSource(src);
    storage.set(STORAGE_KEYS.UPDATE_SOURCE, src);
    setResult(null);
  };

  const toggleAuto = (val) => {
    setAutoCheck(val);
    storage.set(STORAGE_KEYS.AUTO_CHECK_UPDATES, val ? 1 : 0);
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1800);
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">App Version</div>

      {/* Version row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--text3)" }}>
            Current version
          </span>
          <code
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "4px 12px",
            }}
          >
            v{currentVersion}
          </code>
        </div>

        <button
          className="btn btn-ghost"
          disabled={checking}
          onClick={runCheck}
          style={{ opacity: checking ? 0.6 : 1 }}
        >
          {checking ? "Checking…" : "Check for Updates"}
        </button>

        {/* Update source toggle */}
        <div
          style={{
            display: "inline-flex",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {Object.values(UPDATE_SOURCES).map((src) => (
            <button
              key={src.id}
              onClick={() => changeSource(src.id)}
              disabled={checking}
              title={`Check for updates via ${src.label}`}
              style={{
                border: "none",
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: checking ? "not-allowed" : "pointer",
                background:
                  updateSource === src.id ? "var(--red)" : "var(--surface2)",
                color: updateSource === src.id ? "#fff" : "var(--text3)",
              }}
            >
              {src.label}
            </button>
          ))}
        </div>

        {result && !result.error && result.hasUpdate && (
          <button
            onClick={() => setShowUpdateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(229,9,20,0.12)",
              border: "1px solid rgba(229,9,20,0.4)",
              color: "var(--red)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(229,9,20,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(229,9,20,0.12)")
            }
          >
            🎉 v{result.latest} available. Install Update
          </button>
        )}

        {result?.usedFallback && (
          <span style={{ fontSize: 12, color: "var(--text3)" }}>
            ({UPDATE_SOURCES[result.fallbackFrom]?.label || result.fallbackFrom}{" "}
            unavailable, used {result.sourceLabel} instead)
          </span>
        )}

        {result && !result.error && !result.hasUpdate && (
          <span style={{ fontSize: 13, color: "#48c774", fontWeight: 500 }}>
            ✓ You're up to date
          </span>
        )}

        {result?.error && (
          <span style={{ fontSize: 13, color: "var(--red)" }}>
            ✕ {result.error}
          </span>
        )}
      </div>

      {showUpdateModal && result?.hasUpdate && (
        <UpdateModal
          updateInfo={result}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      {/* Auto-check toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Toggle
          value={autoCheck}
          onChange={toggleAuto}
          title={autoCheck ? "Disable auto-check" : "Enable auto-check"}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
            Check for updates on startup
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
            Shows a notification banner if a new version is available. Turned on
            by default.
          </div>
        </div>
        {autoSaved && (
          <span style={{ fontSize: 12, color: "#48c774" }}>✓ Saved</span>
        )}
      </div>
    </div>
  );
}

export function ScheduledBackupSection() {
  const [enabled, setEnabled] = useState(false);
  const [backupPath, setBackupPath] = useState("");
  const [keepCount, setKeepCount] = useState(5);
  const [frequency, setFrequency] = useState("startup");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isElectron) {
      setLoading(false);
      return;
    }
    window.electron.getScheduledBackupSettings().then((s) => {
      if (s) {
        setEnabled(!!s.enabled);
        setBackupPath(s.path || "");
        setKeepCount(s.keepCount ?? 5);
        setFrequency(s.frequency || "startup");
      }
      setLoading(false);
    });
  }, []);

  const pickFolder = async () => {
    if (!isElectron) return;
    const folder = await window.electron.pickFolder();
    if (folder) setBackupPath(folder);
  };

  const handleSave = async () => {
    if (!isElectron) return;
    const settings = {
      enabled,
      path: backupPath,
      keepCount: Math.max(1, Math.min(99, Number(keepCount) || 5)),
      frequency,
      lastRun: null,
    };
    // preserve lastRun from existing settings
    const existing = await window.electron.getScheduledBackupSettings();
    if (existing?.lastRun) settings.lastRun = existing.lastRun;
    await window.electron.setScheduledBackupSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isElectron || loading) return null;

  return (
    <div
      style={{
        marginTop: 28,
        padding: "20px 22px",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      {/* Header row with toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: enabled ? 20 : 0,
        }}
      >
        <Toggle value={enabled} onChange={setEnabled} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Scheduled Backups
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
            Automatically save a backup file on a schedule
          </div>
        </div>
      </div>

      {enabled && (
        <>
          {/* Backup path */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text2)",
                marginBottom: 6,
              }}
            >
              Backup Folder
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="apikey-input"
                style={{ flex: 1, marginBottom: 0 }}
                placeholder="/home/you/Backups"
                value={backupPath}
                onChange={(e) => setBackupPath(e.target.value)}
              />
              <button
                className="btn btn-ghost"
                style={{ padding: "7px 14px", fontSize: 13 }}
                onClick={pickFolder}
              >
                Browse…
              </button>
            </div>
          </div>

          {/* Frequency + Keep count row */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 160 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text2)",
                  marginBottom: 6,
                }}
              >
                Frequency
              </div>
              <SettingsSelect
                value={frequency}
                onChange={(v) => setFrequency(v)}
                options={FREQUENCY_OPTIONS}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 120 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text2)",
                  marginBottom: 6,
                }}
              >
                Keep Last N Backups
              </div>
              <input
                type="number"
                min={1}
                max={99}
                className="apikey-input"
                style={{ width: "100%", marginBottom: 0 }}
                value={keepCount}
                onChange={(e) => setKeepCount(e.target.value)}
              />
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
        </>
      )}

      {!enabled && (
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 0 }}
        >
          {/* empty, toggle handles everything */}
        </div>
      )}
    </div>
  );
}

export function BackupRestoreSection({ onRestored }) {
  const [restoreStatus, setRestoreStatus] = useState(null);

  const handleExport = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: collectBackupData(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streambert-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result);
        if (!backup?.data)
          throw new Error("Invalid backup file, missing data field.");
        restoreBackupData(backup.data);
        setRestoreStatus("✓ Backup restored: reloading…");
        setTimeout(() => window.location.reload(), 1200);
        onRestored?.();
      } catch (err) {
        setRestoreStatus("✕ " + (err.message || "Could not read backup file."));
        setTimeout(() => setRestoreStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Backup &amp; Restore</div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text3)",
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        Export your watchlist, watch history, progress, and all settings to a
        JSON file. Import it later to restore everything, useful before
        reinstalling or switching devices.
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button className="btn btn-primary" onClick={handleExport}>
          ⬆ Export Backup
        </button>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--surface)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--surface2)")
          }
        >
          ⬇ Import Backup
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </label>
        {restoreStatus && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: restoreStatus.startsWith("✕") ? "var(--red)" : "#48c774",
            }}
          >
            {restoreStatus}
          </span>
        )}
      </div>
      <ScheduledBackupSection />
    </div>
  );
}

export function NotificationsSection() {
  const [notifyDownload, setNotifyDownload] = useState(
    () => storage.get(STORAGE_KEYS.NOTIFY_DOWNLOAD_COMPLETE) !== false,
  );
  const [notifyEpisode, setNotifyEpisode] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.NOTIFY_NEW_EPISODE);
    return stored === null || stored === undefined ? true : !!stored;
  });
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    storage.set(STORAGE_KEYS.NOTIFY_DOWNLOAD_COMPLETE, notifyDownload);
    storage.set(STORAGE_KEYS.NOTIFY_NEW_EPISODE, notifyEpisode);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ToggleRow = ({ label, description, value, onChange }) => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Toggle value={value} onChange={onChange} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
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
          {description}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Desktop Notifications</div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text3)",
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Control which events trigger a desktop notification.
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "0 16px",
          marginBottom: 20,
        }}
      >
        <ToggleRow
          label="Notify when a download completes"
          description="Shows a desktop notification when an item finishes downloading."
          value={notifyDownload}
          onChange={setNotifyDownload}
        />
        <ToggleRow
          label="Notify about new episodes on startup"
          description="On startup, checks every TV series you have saved for newly released episodes and notifies you if any aired since the last check."
          value={notifyEpisode}
          onChange={setNotifyEpisode}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn btn-primary" onClick={saveSettings}>
          Save
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#48c774" }}>✓ Saved</span>
        )}
      </div>
    </div>
  );
}

export function StartPageSection() {
  const [startPage, setStartPage] = useState(
    () => storage.get(STORAGE_KEYS.START_PAGE) || "home",
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    storage.set(STORAGE_KEYS.START_PAGE, startPage);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="settings-section-title">Start Page</div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text3)",
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Choose which page opens when you launch Streambert.
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
          value={startPage}
          onChange={(v) => setStartPage(v)}
          options={[
            { value: "home", label: "🏠  Home" },
            { value: "history", label: "🕐  Library / History" },
            { value: "downloads", label: "⬇  Downloads" },
          ]}
        />
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

