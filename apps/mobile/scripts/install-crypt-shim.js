/**
 * Postinstall: ensure md5 (used by Expo CLI analytics) can resolve 'crypt', 'charenc', 'is-buffer' on Windows.
 * 1) Creates node_modules/md5/node_modules/crypt/index.js from our pure-JS shim.
 * 2) Installs charenc and is-buffer into node_modules/md5/node_modules so md5 finds them.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const md5Dir = path.join(root, 'node_modules', 'md5');
const cryptDir = path.join(md5Dir, 'node_modules', 'crypt');
const shimPath = path.join(__dirname, 'crypt-shim.js');
const targetPath = path.join(cryptDir, 'index.js');

if (!fs.existsSync(md5Dir)) {
  console.log('apps/mobile: md5 not found, skipping Expo CLI Windows fix');
  process.exit(0);
}

try {
  fs.mkdirSync(cryptDir, { recursive: true });
  fs.copyFileSync(shimPath, targetPath);
  console.log('apps/mobile: crypt shim installed for Expo CLI (Windows fix)');
} catch (err) {
  console.warn('apps/mobile: could not install crypt shim:', err.message);
}

// Install charenc and is-buffer inside md5's node_modules so require('charenc') and require('is-buffer') resolve
try {
  fs.mkdirSync(path.join(md5Dir, 'node_modules'), { recursive: true });
  execSync('npm install charenc@0.0.2 is-buffer@1.1.6 --no-save --prefix node_modules/md5', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  console.log('apps/mobile: charenc + is-buffer installed for md5 (Expo CLI)');
} catch (err) {
  console.warn('apps/mobile: could not install charenc/is-buffer for md5:', err.message);
}
