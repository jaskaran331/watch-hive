const fs = require('fs');
let css = fs.readFileSync('src/styles/global.css', 'utf8');

css = css.replace(/\.card-play \{[\s\S]*?\}/, `.card-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: all 0.2s;
}

.card-play svg {
    width: 48px;
    height: 48px;
    color: #000;
    background: #ffb703;
    border-radius: 50%;
    padding: 12px;
    box-shadow: 0 4px 12px rgba(255, 183, 3, 0.4);
}

.card-rank {
    position: absolute;
    bottom: -8px;
    left: -6px;
    font-size: 80px;
    font-weight: 900;
    line-height: 1;
    color: white;
    -webkit-text-stroke: 2px black;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    z-index: 10;
    font-family: var(--font-display);
    letter-spacing: -2px;
}`);

// We might need to ensure .card-poster doesn't clip the rank text too much.
// But .card-poster has overflow: hidden. We might need to allow overflow or adjust the left property.
// Let's modify .card-poster to overflow: visible, but wait, then the rounded corners for the poster image will be lost.
// The rounded corners should be on the img.

css = css.replace(/\.card-poster img \{[\s\S]*?\}/, `.card-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    border-radius: var(--radius);
}`);

css = css.replace(/\.card-poster \{[\s\S]*?\}/, `.card-poster {
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: var(--radius);
    background: var(--bg);
    margin-bottom: 12px;
    /* overflow: hidden; removed to allow rank number to pop out */
}`);

fs.writeFileSync('src/styles/global.css', css);
