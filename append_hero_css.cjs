const fs = require('fs');
let css = fs.readFileSync('src/styles/global.css', 'utf8');

css += `
.hero-type {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 8px;
}

.hero-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 16px;
}
`;

fs.writeFileSync('src/styles/global.css', css);
