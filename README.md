# path-cygwin-patch
A npm module to replace methods of `path` to handle paths starting with `'/'` in Cygwin or MSYS2.

## Description
The `path` module of Node.js does not handle paths starting with `'/'` in Cygwin or MSYS2, so sometimes yields an invalid path and causes a problem.

```JavaScript
// On MSYS2

const path = require('path');

console.log(path.join('/c/Users', 'iorate/Documents')); // => \c\Users\iorate\Documents
```

This module exports nothing but patches `path` in Cygwin or MSYS2.

```JavaScript
const path = require('path');
require('path-cygwin-patch');

console.log(path.join('/c/Users', 'iorate/Documents')); // => C:\Users\iorate\Documents
```

Some npm executables accept configuration files written in JavaScript. If such an executable has a problem on Cygwin or MSYS2, you can try to inject this module in a configuration file.

```JavaScript
// .foorc.js

require('path-cygwin-patch');

module.exports = {
  // ...
};
```

## Test
```Shell
npm install

npm test
```

## Known Issue
Patched functions are SLOW because they invoke `cygpath` internally.

## Author
[iorate](https://github.com/iorate) ([Twitter](https://twitter.com/iorate))

## License
`path-cygwin-patch` is licensed under [MIT License](LICENSE.txt).
