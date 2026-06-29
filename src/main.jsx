import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// Mock window.electron for web environment
window.electron = {
  onScheduledBackupRequested: () => {},
  offScheduledBackupRequested: () => {},
  getScheduledBackupSettings: async () => ({ enabled: false }),
  performScheduledBackup: async () => {},
  getAppVersion: async () => "2.5.0",
  onM3u8Found: () => {},
  offM3u8Found: () => {},
  onSubtitleFound: () => {},
  offSubtitleFound: () => {},
  playerStopped: () => {},
  queryVideoProgress: async () => null,
  onWebviewEnterFullscreen: () => {},
  onWebviewLeaveFullscreen: () => {},
  offWebviewEnterFullscreen: () => {},
  offWebviewLeaveFullscreen: () => {},
  onPipOpened: () => {},
  onPipClosed: () => {},
  offPipOpened: () => {},
  offPipClosed: () => {},
  getPipWebContentsId: async () => null,
  closePipWindow: () => {},
  openPipWindow: () => {},
  openExternal: (url) => window.open(url, "_blank"),
  getCacheSize: async () => 0,
  getDownloadsSize: async () => 0,
  pickFolder: async () => null,
  clearWatchData: async () => {},
  deleteAllDownloads: async () => {},
  resetApp: async () => { localStorage.clear(); window.location.reload(); },
  getInstallPath: async () => null,
  openPath: () => {},
  setZoomFactor: () => {},
  getBlockStats: async () => ({ blocked_hosts: 0 }),
  onBlockedUpdate: () => {},
  offBlockedUpdate: () => {},
  showNotification: () => {},
  getPlatform: async () => "web",
  onConfirmClose: () => () => {},
  offConfirmClose: () => {},
  getDownloads: async () => [],
  fileExists: async () => false,
  deleteDownload: () => {},
  pruneSubtitlePaths: async () => {},
  onDownloadProgress: () => () => {},
  offDownloadProgress: () => {},
  resolveAllManga: async () => null,
};

import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <Analytics />
    </HelmetProvider>
  </React.StrictMode>,
);
