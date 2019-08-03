const main = () => {
  if (process.platform !== 'win32') {
    return;
  }

  const { execSync } = require('child_process');
  const cygpath = p => {
    return execSync(`cygpath -w -C UTF8 "${p}"`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).split(/\r\n|\n/)[0];
  };
  try {
    cygpath('/');
  } catch (_e) {
    return;
  }

  const path = require('path');
  const win32 = { ...path };

  // A UNC path is not a mount point.
  const isMountPoint = p => /^\/(?![\\/][^\\/]+[\\/]+[^\\/]+)/.test(p);

  const resolveMountPoint = p => {
    // Unfortunately, 'cygpath -w' checks if a path followed by '..' really exists.
    // Remove '..' before calling 'cygpath'.
    const normalized = win32.normalize(p).replace(/\\/g, '/');
    // On Cygwin, 'cygpath -w /' does not append a backslash.
    const resolved = cygpath(normalized);
    if (normalized === '/' && !resolved.endsWith('\\')) {
      return resolved + '\\';
    } else {
      return resolved;
    }
  };

  path.normalize = p => {
    if (isMountPoint(p)) {
      return resolveMountPoint(p);
    } else {
      return win32.normalize(p);
    }
  };

  path.resolve = (...ps) => {
    for (let i = ps.length - 1; i >= 0; --i) {
      if (isMountPoint(ps[i])) {
        // It is enough to resolve the last mount point,
        // because the arguments before it are not used.
        ps[i] = resolveMountPoint(ps[i]);
        break;
      }
    }
    return win32.resolve(...ps);
  };

  path.win32 = path.posix.win32 = win32.win32 = win32;
};

main();
