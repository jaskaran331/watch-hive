const fs = require('fs');

function fixMobileLayout() {
    let content = fs.readFileSync('src/styles/global.css', 'utf8');
    
    // Normalize newlines
    content = content.replace(/\r\n/g, '\n');

    // Fix detail-actions on mobile
    const oldActions = `.detail-actions {
        justify-content: center;
        flex-wrap: wrap;
    }`;
    const newActions = `.detail-actions {
        justify-content: center;
        flex-wrap: wrap;
        width: 100%;
        gap: 8px;
        padding: 0 16px;
        box-sizing: border-box;
    }`;
    content = content.replace(oldActions, newActions);

    // Fix player-wrap on mobile
    const oldPlayer = `.player-wrap {
        margin: 0 16px 20px 16px;
        border-radius: 8px;
        aspect-ratio: 16 / 9;
        min-height: 240px;
    }`;
    const newPlayer = `.player-wrap {
        margin: 0 auto 20px auto;
        width: calc(100% - 32px);
        max-width: 100vw;
        border-radius: 8px;
        aspect-ratio: 16 / 9;
        min-height: 240px;
        box-sizing: border-box;
    }`;
    content = content.replace(oldPlayer, newPlayer);

    // Fix cast-list on mobile
    // Add it inside the mobile media query
    const mobileCastFix = `
    .detail-cast-list {
        max-width: 100vw;
        width: 100%;
        padding: 0 16px;
        box-sizing: border-box;
    }
    
    .site-footer {
        padding-bottom: 100px; /* Space for mobile bottom bar */
    }
    `;
    
    // Insert after newPlayer
    content = content.replace(newPlayer, newPlayer + "\n" + mobileCastFix);

    // Also let's make sure the detail-content has no overflowing width
    // Just in case, add overflow-x: hidden to body in mobile? No, that can break sticky.
    
    fs.writeFileSync('src/styles/global.css', content);
    console.log("Mobile layout fixed successfully.");
}

fixMobileLayout();
