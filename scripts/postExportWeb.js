const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const webJsDir = path.join(distDir, '_expo', 'static', 'js', 'web');

// 1. Add cache-control and color-scheme meta tags to dist/index.html
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const metaTags = [
    '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
    '<meta http-equiv="Pragma" content="no-cache" />',
    '<meta http-equiv="Expires" content="0" />',
    '<meta name="color-scheme" content="light" />'
  ].join('\n    ');
  html = html.replace('<head>', `<head>\n    ${metaTags}`);
  fs.writeFileSync(indexPath, html, 'utf8');
}

// 2. Alias previous bundle hashes to the current bundle so cached index.html on mobile devices still loads the latest code
if (fs.existsSync(webJsDir)) {
  const files = fs.readdirSync(webJsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
  if (files.length > 0) {
    const latestFile = path.join(webJsDir, files[0]);
    const previousHashes = [
      'index-24330c0f64af7a98092d1fd49e70d2dc.js',
      'index-10d25a2e2ee7f28191eff1120f454fc6.js',
      'index-291c2f64d17d8dc434203364508a40d7.js',
      'index-fb47b3f4fbea560214210f38ff858e5b.js',
      'index-b3c39ae342dd10727b8cdf13b314eaa7.js',
      'index-3db9231d81ea7f561a4dfa7a75c8bd7d.js',
      'index-3120acc27cf31168329d94dd5f019937.js',
      'index-29f2e032b5159e2e458047366c8ff4fc.js'
    ];
    for (const prevName of previousHashes) {
      const dest = path.join(webJsDir, prevName);
      if (dest !== latestFile) {
        fs.copyFileSync(latestFile, dest);
      }
    }
  }
}

// 3. Ensure .nojekyll exists
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
