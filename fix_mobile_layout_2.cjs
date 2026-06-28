const fs = require('fs');

function fixMobileLayoutPerfect() {
    let content = fs.readFileSync('src/styles/global.css', 'utf8');
    
    // Normalize newlines
    content = content.replace(/\r\n/g, '\n');

    // 1. Fix detail-actions on mobile
    // It should not have width: 100% blindly if it causes centering overflow,
    // just let it wrap and align center.
    content = content.replace(
        /\.detail-actions\s*\{\s*justify-content:\s*center;\s*flex-wrap:\s*wrap;[\s\S]*?\}/,
        `.detail-actions {
        justify-content: center;
        flex-wrap: wrap;
        width: 100%;
        max-width: calc(100vw - 40px); /* Account for detail-content padding */
        gap: 10px;
    }`
    );

    // Make buttons wrap gracefully and not shrink unreadably
    // Find .btn in mobile query and update it
    content = content.replace(
        /\.btn\s*\{\s*padding:\s*9px 16px;\s*font-size:\s*13px;\s*\}/,
        `.btn {
        padding: 9px 16px;
        font-size: 13px;
        white-space: nowrap;
        flex: 1 1 auto;
        justify-content: center;
    }`
    );

    // 2. Fix cast list left-cutoff
    // If we used width: 100% and max-width: 100vw inside a flex center container, it bleeds both ways.
    // Replace the old cast fix
    const oldCastFix = `
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
    const newCastFix = `
    .detail-cast-list {
        max-width: calc(100vw - 40px);
        width: 100%;
        padding-bottom: 8px;
        box-sizing: border-box;
        align-self: flex-start;
    }
    
    .site-footer {
        padding-bottom: 100px; /* Space for mobile bottom bar */
    }
    `;
    if (content.includes(oldCastFix)) {
        content = content.replace(oldCastFix, newCastFix);
    } else {
        // Just in case, try to append it to the end of the mobile media query
        // Let's replace the .site-footer rule if it exists or insert at end.
    }

    // 3. Fix player centering
    // Replace my previous player fix
    const oldPlayer = `.player-wrap {
        margin: 0 auto 20px auto;
        width: calc(100% - 32px);
        max-width: 100vw;
        border-radius: 8px;
        aspect-ratio: 16 / 9;
        min-height: 240px;
        box-sizing: border-box;
    }`;
    const newPlayer = `.player-wrap {
        margin: 0;
        width: 100%;
        border-radius: 8px;
        aspect-ratio: 16 / 9;
        min-height: 240px;
        box-sizing: border-box;
    }`;
    content = content.replace(oldPlayer, newPlayer);

    fs.writeFileSync('src/styles/global.css', content);
    console.log("Mobile layout strictly fixed.");
}

fixMobileLayoutPerfect();
