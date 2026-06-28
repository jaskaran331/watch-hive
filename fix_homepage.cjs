const fs = require('fs');

let jsx = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Fix the deleted MediaCard in "continue watching" block
const brokenBlockRegex = /const restr = itemRestricted\(item\);\s*\n\s*\);\s*\n\s*\}\)\}/m;

const replacement = `const restr = itemRestricted(item);
                  return (
                    <MediaCard
                      key={\`\${item.media_type}_\${item.id}\`}
                      item={item}
                      onClick={() => onSelect(item)}
                      progress={progress[pk] || 0}
                      watched={watched}
                      onMarkWatched={onMarkWatched}
                      onMarkUnwatched={onMarkUnwatched}
                      ageRating={r.cert}
                      restricted={restr}
                    />
                  );
                })}`;

jsx = jsx.replace(brokenBlockRegex, replacement);

fs.writeFileSync('src/pages/HomePage.jsx', jsx);
