const fs = require('fs');

function updateDetailsCSS() {
  let css = fs.readFileSync('src/styles/global.css', 'utf8');

  // Update .detail-hero to match overlapping poster style
  css = css.replace(
    /\.detail-hero \{[\s\S]*?\}/,
    `.detail-hero {
    position: relative;
    padding-bottom: 2rem;
}`
  );

  css = css.replace(
    /\.detail-bg \{[\s\S]*?\}/,
    `.detail-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60vh;
    min-height: 400px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
}`
  );

  css = css.replace(
    /\.detail-gradient \{[\s\S]*?\}/,
    `.detail-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60vh;
    min-height: 400px;
    background: linear-gradient(to top, var(--bg) 0%, transparent 100%);
    z-index: 1;
}`
  );

  css = css.replace(
    /\.detail-content \{[\s\S]*?\}/,
    `.detail-content {
    position: relative;
    display: flex;
    gap: 32px;
    padding: 24px var(--safe-px);
    max-width: 1400px;
    margin: 0 auto;
    z-index: 2;
    padding-top: calc(60vh - 200px);
}`
  );

  css = css.replace(
    /\.detail-poster \{[\s\S]*?\}/,
    `.detail-poster {
    width: 250px;
    flex-shrink: 0;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    background: var(--bg-elevated);
    border: 1px solid rgba(255,255,255,0.1);
}`
  );

  css += `
.detail-cast {
    margin-top: 24px;
    margin-bottom: 24px;
}
.detail-cast-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text2);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.detail-cast-list {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
}
.detail-cast-list::-webkit-scrollbar {
    height: 4px;
}
.detail-cast-list::-webkit-scrollbar-thumb {
    background: var(--bg-elevated);
    border-radius: 4px;
}
.cast-member {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80px;
    flex-shrink: 0;
    text-align: center;
}
.cast-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 8px;
    background: var(--bg-elevated);
    border: 2px solid rgba(255,255,255,0.1);
}
.cast-name {
    font-size: 12px;
    color: var(--text);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
.cast-role {
    font-size: 11px;
    color: var(--text3);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
}
`;

  fs.writeFileSync('src/styles/global.css', css);
}

updateDetailsCSS();
