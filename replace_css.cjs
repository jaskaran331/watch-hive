const fs = require('fs');
let css = fs.readFileSync('src/styles/global.css', 'utf8');

// Replace hero-gradient
css = css.replace(/\.hero-gradient \{[\s\S]*?\}/, `.hero-gradient {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(to top, var(--bg) 0%, transparent 50%),
        radial-gradient(circle at center 30%, transparent 0%, color-mix(in srgb, var(--bg) 80%, transparent) 100%);
}`);

// Replace hero-content
css = css.replace(/\.hero-content \{[\s\S]*?\}/, `.hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 60px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}`);

// Replace hero-type
css = css.replace(/\.hero-type \{[\s\S]*?\}/, `.hero-type {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #ffb703;
    background: rgba(255, 183, 3, 0.15);
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255, 183, 3, 0.3);
    margin-bottom: 12px;
}`);

// Replace hero-title
css = css.replace(/\.hero-title \{[\s\S]*?\}/, `.hero-title {
    font-family: var(--font-display);
    font-size: 72px;
    line-height: 1;
    color: var(--text);
    margin-bottom: 16px;
    letter-spacing: 0px;
    text-shadow: 0px 4px 20px rgba(0,0,0,0.5);
    font-weight: 800;
}`);

// Replace hero-meta
css = css.replace(/\.hero-meta \{[\s\S]*?\}/, `.hero-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: 13px;
    color: var(--text2);
    margin-bottom: 20px;
}`);

// Replace hero-overview
css = css.replace(/\.hero-overview \{[\s\S]*?\}/, `.hero-overview {
    font-size: 14px;
    color: var(--text2);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 30px;
    max-width: 700px;
    text-shadow: 0px 2px 10px rgba(0,0,0,0.8);
}`);

// Replace hero-actions
css = css.replace(/\.hero-actions \{[\s\S]*?\}/, `.hero-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
}

.hero-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
}

.hero-nav-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
}

.hero-nav-btn.left {
    left: 24px;
}

.hero-nav-btn.right {
    right: 24px;
}

.hero-nav-btn svg {
    width: 20px;
    height: 20px;
}

.btn-yellow {
    background: #ffb703;
    color: #000;
    border-radius: 30px;
    padding: 12px 32px;
    font-weight: 700;
}

.btn-yellow:hover {
    background: #ffc300;
    box-shadow: 0 4px 15px rgba(255, 183, 3, 0.4);
    transform: translateY(-2px);
}`);

fs.writeFileSync('src/styles/global.css', css);
