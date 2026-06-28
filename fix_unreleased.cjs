const fs = require('fs');

function fixUnreleasedLogic() {
    // Fix MoviePage.jsx
    let moviePath = 'src/pages/MoviePage.jsx';
    let movieContent = fs.readFileSync(moviePath, 'utf8');
    movieContent = movieContent.replace(/\r\n/g, '\n');
    
    const oldMovieLogic = `const isUnreleased = useMemo(() => {
    if (!d.release_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(d.release_date) > today;
  }, [d.release_date]);`;

    const newMovieLogic = `const isUnreleased = useMemo(() => {
    if (!d.release_date) return false;
    const today = new Date();
    const todayStr = \`\${today.getFullYear()}-\${String(today.getMonth() + 1).padStart(2, '0')}-\${String(today.getDate()).padStart(2, '0')}\`;
    return d.release_date > todayStr;
  }, [d.release_date]);`;

    if (movieContent.includes(oldMovieLogic)) {
        movieContent = movieContent.replace(oldMovieLogic, newMovieLogic);
        fs.writeFileSync(moviePath, movieContent);
        console.log("MoviePage.jsx updated successfully.");
    } else {
        console.log("Could not find old logic in MoviePage.jsx");
    }

    // Fix TVPage.jsx
    let tvPath = 'src/pages/TVPage.jsx';
    let tvContent = fs.readFileSync(tvPath, 'utf8');
    tvContent = tvContent.replace(/\r\n/g, '\n');

    const oldTodayConst = `const _todayForEpisodes = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();`;
    
    const newTodayConst = `const _todayStrForEpisodes = (() => {
  const d = new Date();
  return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
})();`;

    const oldEpUnreleased = `const epUnreleased = ep.air_date
    ? new Date(ep.air_date) > _todayForEpisodes
    : false;`;

    const newEpUnreleased = `const epUnreleased = ep.air_date
    ? ep.air_date > _todayStrForEpisodes
    : false;`;

    if (tvContent.includes(oldTodayConst) && tvContent.includes(oldEpUnreleased)) {
        tvContent = tvContent.replace(oldTodayConst, newTodayConst);
        tvContent = tvContent.replace(oldEpUnreleased, newEpUnreleased);
        fs.writeFileSync(tvPath, tvContent);
        console.log("TVPage.jsx updated successfully.");
    } else {
        console.log("Could not find old logic in TVPage.jsx");
    }
}

fixUnreleasedLogic();
