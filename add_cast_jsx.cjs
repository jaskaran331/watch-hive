const fs = require('fs');

function addCastToJSX(file) {
  let jsx = fs.readFileSync(file, 'utf8');
  
  const castJSX = `
            {d.credits?.cast && d.credits.cast.length > 0 && (
              <div className="detail-cast">
                <div className="detail-cast-title">Top Cast</div>
                <div className="detail-cast-list">
                  {d.credits.cast.slice(0, 10).map((actor) => (
                    <div key={actor.id} className="cast-member">
                      {actor.profile_path ? (
                        <img className="cast-avatar" src={imgUrl(actor.profile_path, 'w185')} alt={actor.name} loading="lazy" />
                      ) : (
                        <div className="cast-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 24, color: 'var(--text3)' }}>{actor.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="cast-name">{actor.name}</span>
                      <span className="cast-role">{actor.character}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
`;
  
  // Insert before <p className="detail-overview">
  jsx = jsx.replace(
    /<p className="detail-overview">/,
    castJSX + '\n            <p className="detail-overview">'
  );

  fs.writeFileSync(file, jsx);
}

addCastToJSX('src/pages/MoviePage.jsx');
addCastToJSX('src/pages/TVPage.jsx');
