const path = require('node:path');

function resolveApiBuildOutputPaths(packageRoot) {
  const distRoot = path.join(packageRoot, 'dist');
  const entryFile = path.join(distRoot, 'apps', 'api', 'src', 'main.js');

  return {
    distRoot,
    entryFile,
  };
}

module.exports = {
  resolveApiBuildOutputPaths,
};
