import React from "react";

import { PlayIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <a href="/" className="footer-logo" style={{textDecoration: "none", color: "inherit"}}>
          <img src="/logo.png" alt="watch-hive logo" style={{width: 28, height: 28, borderRadius: 4}} /> watch-hive
        </a>
        <p className="footer-disclaimer">
          watch-hive does not store any files on our server, we only link to the media which is hosted on 3rd party services.
        </p>
      </div>
    </footer>
  );
}
