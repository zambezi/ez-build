'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _readPackageJson = require('read-package-json');

var _readPackageJson2 = _interopRequireDefault(_readPackageJson);

var _glob = require('glob');

var _pkginfo = require('pkginfo');

var _path = require('path');

var _child_process = require('child_process');

var _requirejs = require('requirejs');

var _fs = require('fs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pkgFile = (0, _pkginfo.find)(module, process.cwd()),
    pkgRoot = (0, _path.dirname)(pkgFile),
    pkgPath = _path.relative.bind(null, pkgRoot);

(0, _readPackageJson2.default)(pkgFile, function (err, pkg) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  pkg.directories || (pkg.directories = {});

  var defaults = { out: pkgPath(pkg.name + '-min.js'),
    lib: pkgPath(pkg.directories.lib || 'lib'),
    src: pkgPath(pkg.directories.src || 'src'),
    jsc: 'babel',
    jscFlag: { presets: ['es2015'],
      plugins: ['transform-es2015-modules-amd']
    },
    include: ['**/*.js'],
    exclude: [],
    optimize: 0
  };

  var cli = _commander2.default.version(require('../package.json').version).option('-i, --src <dir>', 'the root directory from which all sources are relative [' + defaults.src + ']', pkgPath, defaults.src).option('-o, --out <file>', 'write optimized output to the specified file [' + defaults.out + ']', pkgPath, defaults.out).option('-L, --lib <dir>', 'write unoptimized files to the specified directory [' + defaults.lib + ']', pkgPath, defaults.lib).option('-O, --optimize <level>', 'specifies optimization level (0|1) [' + defaults.optimize + ']', setOptimization, defaults.optimize).option('-I, --include <path>', 'include the specified path or glob (relative to source root) [' + defaults.include + ']', addPath.bind(null, defaults.include), defaults.include).option('-X, --exclude <path>', 'exclude the specified path or glob (relative to source root)', addPath.bind(null, defaults.exclude), defaults.exclude).option('--jsc <compiler>', 'specifies the JS compiler command to be invoked [' + defaults.jsc + ']', String, defaults.jsc).option('--jsc-flag <flag>=<value>', 'specifies compiler flags; use += for additive behavior [' + formatCCArgs(defaults.jscFlag) + ']', setFlag.bind(null, defaults.jscFlag), defaults.jscFlag);

  var opts = cli.parse(process.argv);

  setFlag(opts.jscFlag, { 'source-maps': true,
    'module-ids': true,
    'module-root': pkg.name + '/' + opts.lib,
    'source-root': opts.src
  });

  opts.include.length > 0 && setFlag(opts.jscFlag, { only: opts.include });
  opts.exclude.length > 0 && setFlag(opts.jscFlag, { ignore: opts.exclude });

  var jscArgs = Object.keys(opts.jscFlag).map(function (name) {
    var pre = /^-|--/.test(name) ? '' : '--',
        val = '=' + opts.jscFlag[name];

    if (typeof opts.jscFlag[name] === 'boolean') {
      opts.jscFlag[name] ? val = '' : pre = pre + 'no-';
    }

    return '' + pre + name + val;
  });

  var cmd = opts.jsc + ' ' + opts.src + ' ' + getTarget(opts) + ' ' + formatCCArgs(opts.jscFlag),
      PATH = '' + (0, _path.normalize)('node_modules/.bin') + _path.delimiter + process.env.PATH;

  log(cmd);

  log();

  (0, _child_process.execSync)(cmd, { cwd: pkgRoot,
    stdio: 'inherit',
    env: { PATH: PATH }
  });

  if (opts.optimize > 0) {
    var modules = opts.include.reduce(function (list, pattern) {
      return list.concat((0, _glob.sync)(opts.src + '/' + pattern).map(function (f) {
        var name = (0, _path.basename)((0, _path.relative)(opts.src, f), '.js');
        log(name);
        return pkg.name + '/' + opts.lib + '/' + name;
      }));
    }, []);

    var optimizedModules = (0, _path.resolve)(pkgRoot, 'optimized-modules.json');
    (0, _fs.writeFileSync)(optimizedModules, JSON.stringify(modules, null, 2), 'utf8');
  }
});

function setOptimization(level) {
  return Math.max(level | 0, 0);
}

function formatCCArgs(flag) {
  return Object.keys(flag).map(function (name) {
    var pre = /^-|--/.test(name) ? '' : '--',
        val = '=' + flag[name];

    if (typeof flag[name] === 'boolean') {
      flag[name] ? val = '' : pre = pre + 'no-';
    }

    return '' + pre + name + val;
  }).join(' ');
}

function log() {
  if (process.env.DEBUG) {
    var _console$error;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (_console$error = console.error).call.apply(_console$error, [console, '#'].concat(args));
  }
}

function getTarget(opts) {
  var levels = ['--out-dir ' + opts.lib, '--out-file ' + opts.out];

  return levels[opts.optimize] || levels[0];
}

function setFlag(map, input) {
  if (typeof input === 'string') {
    var _input$split = input.split('=');

    var _input$split2 = _slicedToArray(_input$split, 2);

    var k = _input$split2[0];
    var v = _input$split2[1];
    var aliased = v.split(',').aliasFlag;

    if (k.slice(-1) === '+') {
      map[k] = [].concat(map[k], aliased).filter(function (v) {
        return v !== undefined;
      });
    } else {
      map[k] = aliased;
    }
  } else {
    Object.keys(input).forEach(function (k) {
      return map[k] = input[k];
    });
  }

  return map;
}

function aliasFlag(val) {
  return aliases[val] || val;
}

var aliases = { true: true,
  false: false,
  undefined: true
};

function addPath(paths, val) {
  return [val].concat(paths);
}
//# sourceMappingURL=ez-build-bin.js.map