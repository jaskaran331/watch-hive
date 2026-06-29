import {
  HomeIcon,
  SearchIcon,
  HistoryIcon,
  BackIcon,
  CompassIcon,
} from "./Icons";

export default function MobileNav({
  page,
  onNavigate,
  onSearch,
  activeDownloads,
  canGoBack,
  onBack,
}) {
  return (
    <div className="mobile-nav">
      {canGoBack ? (
        <MobileNavBtn onClick={onBack} icon={<BackIcon />} label="Back" />
      ) : (
        <MobileNavBtn
          active={page === "home"}
          onClick={() => onNavigate("home")}
          icon={<HomeIcon />}
          label="Home"
        />
      )}
      <MobileNavBtn
        active={page === "discover"}
        onClick={() => onNavigate("discover")}
        icon={<CompassIcon />}
        label="Discover"
      />
      <MobileNavBtn onClick={onSearch} icon={<SearchIcon />} label="Search" />
      <MobileNavBtn
        active={page === "history"}
        onClick={() => onNavigate("history")}
        icon={<HistoryIcon />}
        label="Library"
      />

    </div>
  );
}

function MobileNavBtn({ active, onClick, icon, label, badge }) {
  return (
    <button
      className={`mobile-nav-btn ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="mobile-nav-icon">
        {icon}
        {badge && <span className="mobile-nav-badge">{badge}</span>}
      </span>
      <span className="mobile-nav-label">{label}</span>
    </button>
  );
}
