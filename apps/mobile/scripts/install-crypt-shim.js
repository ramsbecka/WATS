/**
 * Postinstall: ensure md5 (used by Expo CLI analytics) can resolve 'crypt', 'charenc', 'is-buffer' on Windows.
 * Copies shims into node_modules/md5/node_modules/ so md5 finds them without relying on npm install --prefix.
 */
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const md5Dir = path.join(root, 'node_modules', 'md5');
const md5NodeModules = path.join(md5Dir, 'node_modules');

if (!fs.existsSync(md5Dir)) {
  console.log('apps/mobile: md5 not found, skipping Expo CLI Windows fix');
  process.exit(0);
}

function copyShim(name, targetSubdir, shimFileName) {
  const targetDir = path.join(md5NodeModules, targetSubdir);
  const shimPath = path.join(__dirname, shimFileName);
  const targetPath = path.join(targetDir, targetSubdir === 'crypt' ? 'index.js' : 'index.js');
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(shimPath, targetPath);
    return true;
  } catch (err) {
    console.warn('apps/mobile: could not install', targetSubdir, 'shim:', err.message);
    return false;
  }
}

try {
  fs.mkdirSync(md5NodeModules, { recursive: true });
} catch (err) {
  console.warn('apps/mobile: could not create md5/node_modules:', err.message);
  process.exit(1);
}

let ok = true;
ok = copyShim('crypt', 'crypt', 'crypt-shim.js') && ok;
ok = copyShim('charenc', 'charenc', 'charenc-shim.js') && ok;
ok = copyShim('is-buffer', 'is-buffer', 'is-buffer-shim.js') && ok;

if (ok) {
  console.log('apps/mobile: crypt + charenc + is-buffer shims installed for Expo CLI (Windows fix)');
}
