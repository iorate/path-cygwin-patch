const assert = require('assert');
const path = require('path');
require('..');

// constants
const C = {
  platform: 'posix',
  currentDirectory: process.cwd(),
  currentDevice: '',
  cygwinRoot: '',
  cygwinRootParent: '',
  systemDrive: '',
  systemDriveMountPoint: '/cygdrive/c',
};
if (process.platform === 'win32') {
  C.currentDevice = C.currentDirectory.match(/^(.:|\\\\[^\\]+\\+[^\\]+)/)[0];
  C.systemDrive = process.env.SYSTEMDRIVE;
  const { execSync } = require('child_process');
  const execSimple = command => {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).split(/\r\n|\n/)[0];
  };
  try {
    C.cygwinRoot = execSimple('cygpath -w -c UTF8 /').replace(/\\$/, '');
    C.cygwinRootParent = C.cygwinRoot.replace(/\\[^\\]+$/, '');
    C.systemDriveMountPoint = execSimple(`cygpath -c UTF8 "${C.systemDrive}"`);
    C.platform = 'cygwin';
  } catch (_e) {
    C.platform = 'win32';
  }
}
const quote = p => `'${p.replace(/\\/g, '\\\\')}'`;

const normalizeTests = [
  {
    input:  '/foo/bar//baz/asdf/quux/..',
    cygwin: `${C.cygwinRoot}\\foo\\bar\\baz\\asdf`,
    win32:  '\\foo\\bar\\baz\\asdf',
    posix:  '/foo/bar/baz/asdf',
  },
  {
    input:  'C:\\temp\\\\foo\\bar\\..\\',
    cygwin: 'C:\\temp\\foo\\',
    win32:  'C:\\temp\\foo\\',
    posix:  'C:\\temp\\\\foo\\bar\\..\\',
  },
  {
    input:  'C:////temp\\\\/\\/\\/foo/bar',
    cygwin: 'C:\\temp\\foo\\bar',
    win32:  'C:\\temp\\foo\\bar',
    posix:  'C:/temp\\\\/\\/\\/foo/bar',
  },
  {
    input:  '/foo bar',
    cygwin: `${C.cygwinRoot}\\foo bar`,
    win32:  '\\foo bar',
    posix:  '/foo bar',
  },
  {
    input:  '/..',
    cygwin: `${C.cygwinRoot}\\`,
    win32:  '\\',
    posix:  '/',
  },
  {
    input:  `${C.systemDriveMountPoint}/foo`,
    cygwin: 'C:\\foo',
    win32:  '\\cygdrive\\c\\foo',
    posix:  '/cygdrive/c/foo',
  },
  {
    input:  '//server/share/foo',
    cygwin: '\\\\server\\share\\foo',
    win32:  '\\\\server\\share\\foo',
    posix:  '/server/share/foo',
  },
];
describe('path.normalize()', () => {
  for (const test of normalizeTests) {
    it(`${quote(test.input)} => ${quote(test[C.platform])}`, () => {
      assert.strictEqual(path.normalize(test.input), test[C.platform]);
    });
  }
});

const resolveTests = [
  {
    input:  ['/foo/bar', './baz'],
    cygwin: `${C.cygwinRoot}\\foo\\bar\\baz`,
    win32:  `${C.currentDevice}\\foo\\bar\\baz`,
    posix:  '/foo/bar/baz',
  },
  {
    input:  ['/foo/bar', '/tmp/file'],
    cygwin: `${C.cygwinRoot}\\tmp\\file`,
    win32:  `${C.currentDevice}\\tmp\\file`,
    posix:  '/tmp/file',
  },
  {
    input:  ['wwwroot', 'static_files/png', '../gif/image.gif'],
    cygwin: `${C.currentDirectory}\\wwwroot\\static_files\\gif\\image.gif`,
    win32:  `${C.currentDirectory}\\wwwroot\\static_files\\gif\\image.gif`,
    posix:  `${C.currentDirectory}/wwwroot/static_files/gif/image.gif`,
  },
  {
    input:  ['/foo', '/bar baz'],
    cygwin: `${C.cygwinRoot}\\bar baz`,
    win32:  `${C.currentDevice}\\bar baz`,
    posix:  '/bar baz',
  },
  {
    input:  ['/', '..'],
    cygwin: C.cygwinRootParent,
    win32:  `${C.currentDevice}\\`,
    posix:  '/',
  },
  {
    input:  [C.systemDriveMountPoint, 'foo'],
    cygwin: 'C:\\foo',
    win32:  `${C.currentDevice}\\cygdrive\\c\\foo`,
    posix:  '/cygdrive/c/foo',
  },
  {
    input:  ['/foo/bar', '//server/share/'],
    cygwin: '\\\\server\\share\\',
    win32:  '\\\\server\\share\\',
    posix:  '/server/share',
  },
];
describe('path.resolve()', () => {
  for (const test of resolveTests) {
    it(`[${test.input.map(quote).join(', ')}] => ${quote(test[C.platform])}`, () => {
      assert.strictEqual(path.resolve(...test.input), test[C.platform]);
    });
  }
});
