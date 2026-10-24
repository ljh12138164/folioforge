const { resolve, relative, isAbsolute, sep } = require('node:path');

function assetPath(root, pathname) {
  const file = resolve(root, '.' + decodeURIComponent(pathname).replaceAll('\\', '/'));
  const local = relative(root, file);
  return isAbsolute(local) || local === '..' || local.startsWith('..' + sep) ? null : file;
}

module.exports = { assetPath };
