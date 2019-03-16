#! /usr/bin/env node
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _wrapRegExp(re, groups) { _wrapRegExp = function _wrapRegExp(re, groups) { return new BabelRegExp(re, groups); }; var _RegExp = _wrapNativeSuper(RegExp); var _super = RegExp.prototype; var _groups = new WeakMap(); function BabelRegExp(re, groups) { var _this = _RegExp.call(this, re); _groups.set(_this, groups); return _this; } _inherits(BabelRegExp, _RegExp); BabelRegExp.prototype.exec = function (str) { var result = _super.exec.call(this, str); if (result) result.groups = buildGroups(result, this); return result; }; BabelRegExp.prototype[Symbol.replace] = function (str, substitution) { if (typeof substitution === "string") { var groups = _groups.get(this); return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) { return "$" + groups[name]; })); } else if (typeof substitution === "function") { var _this = this; return _super[Symbol.replace].call(this, str, function () { var args = []; args.push.apply(args, arguments); if (_typeof(args[args.length - 1]) !== "object") { args.push(buildGroups(args, _this)); } return substitution.apply(this, args); }); } else { return _super[Symbol.replace].call(this, str, substitution); } }; function buildGroups(result, re) { var g = _groups.get(re); return Object.keys(groups).reduce(function (groups, name) { groups[name] = result[g[name]]; return groups; }, Object.create(null)); } return _wrapRegExp.apply(this, arguments); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var fs = require('fs');

var ncp = require('ncp');

var rimraf = require('rimraf');

var util = require('util');

var path = require('path');

var chalk = require('chalk');

var inquirer = require('inquirer');

var execCmd = require('child_process').exec;

var argv = require('minimist')(process.argv.slice(2));
/* =================================== */

/* Definitions and stuff
/* =================================== */


var promisify = util.promisify;

var args = argv._,
    options = _objectWithoutProperties(argv, ["_"]);

var packageDir = path.join(process.cwd(), args[0] || '');
var packageName = path.basename(packageDir);
var templatesDir = path.join(__dirname, '../templates');

var versionRegex = _wrapRegExp(/(\d+)\.?(\d+)?\.?(\d+)?(\w+)?/, {
  major: 1,
  minor: 2,
  patch: 3,
  label: 4
});
/* =================================== */

/* Logging
/* =================================== */

/**
 * Clears last line. (duh!)
 */


var clearLastLine = function clearLastLine() {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};
/**
 * Inserts a new line. (duh!)
 */


var insertNewLine = function insertNewLine() {
  process.stdout.write('\n');
};
/**
 * Outputs a line and optionally adds a line break afterwards.
 * Can also be used to update the last line by clearing it before
 * outputting the new one.
 * @param {String}  text        Text to output
 * @param {Boolean} clearLast   Whether the last line should be cleared first
 * @param {Boolean} breakAfter  Whether a line break should be added afterwards
 */


var log = function log(text) {
  var clearLast = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var breakAfter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  if (clearLast) clearLastLine();
  process.stdout.write(text);
  if (breakAfter) insertNewLine();
};
/**
 * Outputs a line and adds an animated ellipsis at the end of the line.
 * @param {String} text Text to output
 */


var ticker = function ticker(text) {
  var i = 0;
  return setInterval(function () {
    log("".concat(text).concat('.'.repeat(i % 4)), i > 0, false);
    i += 1;
  }, 200);
};
/**
 * Outputs a line and optionally prepends a badge.
 * @param {String}  type          One of: success | error | warning | info
 * @param {String}  text          Text to output
 * @param {Boolean} includeBadge  Whether to prepend a badge to the text
 */


var printWithBadge = function printWithBadge(type, text) {
  var includeBadge = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var badgeColors = {
    error: ['white', 'red'],
    success: ['black', 'green'],
    warning: ['black', 'yellow'],
    info: ['black', 'cyanBright']
  };
  var colorFunc = badgeColors[type][1];
  var bgColorFunc = "bg".concat(colorFunc[0].toUpperCase()).concat(colorFunc.slice(1));

  if (includeBadge) {
    log("".concat(chalk[badgeColors[type][0]][bgColorFunc](" ".concat(type, " ")), " "), false, false);
  }

  log(chalk[colorFunc](text));
};
/* =================================== */

/* Help
/* =================================== */


var printHelp = function printHelp() {
  return log("\nSpongepoop\nAn npm package template generator\n(c) Mostafa Fouad\n\nUsage:\n  poop [<package-directory> | <command>] [args]\n\nExample:\n  poop my-app --react --storybook\n\nTo set your GitHub username:\n  poop config --github.username=\"".concat(chalk.gray('<your-username>'), "\"\n\nArgs:\n  --help, -h           Print this help\n  --react, -r          Include React\n  --storybook, -s      Include StoryBook\n"));
};

if (options.help || options.h) {
  printHelp();
  process.exit(0);
}
/* =================================== */

/* Configuration
/* =================================== */


var loadConfig = function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/config.json')));
};

var saveConfig = function saveConfig(data) {
  return fs.writeFileSync(path.join(__dirname, '../data/config.json'), JSON.stringify(data, null, 2), 'utf8');
};
/**
 * Get configuration
 */


var config = loadConfig();
/**
 * Set configuration
 */

if (args[0] === 'config') {
  config.github.username = options.github.username;
  saveConfig(config);
  process.exit(0);
}
/* =================================== */

/* Helpers
/* =================================== */

/**
 * Runs a command.
 * @param {String} command Command to run
 * @returns {Promise}
 */


var run = function run(command) {
  return new Promise(function (resolve, reject) {
    execCmd(command, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
};
/**
 * Deletes files in a directory showing a prompt first.
 * @param {String} dir Path to the directory
 * @returns {Promise}
 */


var cleanDir = function cleanDir(dirPath) {
  var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  return new Promise(function (resolve, reject) {
    var cleanDirConfirmed = function cleanDirConfirmed() {
      rimraf(path.join(dirPath, '{*,.*}'), function (rimrafErr) {
        if (rimrafErr) reject(rimrafErr);
        resolve();
      });
    };

    if (force) {
      cleanDirConfirmed();
      return;
    }

    fs.readdir(dirPath, function (err, files) {
      if (err) reject(err);

      if (files.length > 0) {
        inquirer.prompt([{
          type: 'list',
          name: 'confirmed',
          message: "Destination will be emptied, continue?\n".concat(chalk.gray(dirPath)),
          default: 'No',
          choices: ['Yes', 'No']
        }]).then(function (answers) {
          if (answers.confirmed === 'Yes') {
            cleanDirConfirmed();
          } else {
            process.exit(1);
          }
        });
      } else {
        resolve();
      }
    });
  });
};
/**
 * Copies a file to a certain destination.
 * @param {String} filePath         Target file to copy
 * @param {String} destinationPath  Destination to copy the file to
 */


var copyFile = function copyFile(filePath, destinationPath) {
  return new Promise(function (resolve, reject) {
    ncp(filePath, destinationPath, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
};
/**
 * Reads from file
 * @param {String} filePath Path to the file
 */


var readFile = function readFile(filePath) {
  return promisify(fs.readFile)(filePath, 'utf8');
};
/**
 * Writes data to file
 * @param {String} filePath Path to the file
 * @param {String} content  Data to write
 */


var writeFile = function writeFile(filePath, content) {
  return promisify(fs.writeFile)(filePath, content, 'utf8');
};
/* =================================== */

/* Templates
/* =================================== */


var copyTemplateFiles = function copyTemplateFiles() {
  return new Promise(function (resolve, reject) {
    var files = fs.readdirSync(templatesDir);

    (function copyTemplateFile(fileName) {
      copyFile(path.join(templatesDir, fileName), path.join(packageDir, fileName.replace(/^\$/, ''))).then(function () {
        if (files.length) {
          copyTemplateFile(files.shift());
        } else {
          resolve();
        }
      }).catch(reject);
    })(files.shift());
  });
};

var templateFileHandlers = {};

var processTemplateFiles = function processTemplateFiles(info) {
  return new Promise(function (resolve, reject) {
    var files = fs.readdirSync(packageDir).filter(function (fileName) {
      return typeof templateFileHandlers[fileName] !== 'undefined';
    });
    if (files.length === 0) resolve();

    (function processTemplateFile(fileName) {
      var filePath = path.join(packageDir, fileName);
      readFile(filePath).then(function (content) {
        var processedContent = content.replace(/<github-username>/g, config.github.username).replace(/<package-name>/g, info.packageName).replace(/<package-version>/g, info.packageVersion).replace(/<package-description>/g, info.packageDescription);
        processedContent = templateFileHandlers[fileName](processedContent, info);
        writeFile(filePath, processedContent).then(function () {
          if (files.length) {
            processTemplateFile(files.shift());
          } else {
            resolve();
          }
        }).catch(reject);
      }).catch(reject);
    })(files.shift());
  });
};

var addTemplateFileHandler = function addTemplateFileHandler(filename, handler) {
  templateFileHandlers[filename] = typeof handler === 'function' ? handler : function (v) {
    return v;
  };
};

addTemplateFileHandler('package.json', function (content, info) {
  var data = JSON.parse(content);

  if (!info.packageKeywords.trim()) {
    delete data.keywords;
  } else {
    data.keywords = info.packageKeywords.trim().split(/,+/).map(function (v) {
      return v.trim();
    });
  }

  return JSON.stringify(data, null, 2);
});
addTemplateFileHandler('README.md', true);
/* =================================== */

/* React
/* =================================== */

var installReact = function installReact() {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(resolve, reject) {
      var babelFilePath, babelConfig, webpackFilePath, webpackConfig, rulesMatch, start, pointer, brackets, rules, newWebpackConfig;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return run('npm install react react-dom prop-types');

            case 3:
              _context.next = 5;
              return run('npm install -D @babel/preset-react babel-loader');

            case 5:
              babelFilePath = path.join(packageDir, '.babelrc');
              _context.t0 = JSON;
              _context.next = 9;
              return readFile(babelFilePath);

            case 9:
              _context.t1 = _context.sent;
              babelConfig = _context.t0.parse.call(_context.t0, _context.t1);
              babelConfig.presets.push('@babel/preset-react');
              _context.next = 14;
              return writeFile(babelFilePath, JSON.stringify(babelConfig, null, 2));

            case 14:
              webpackFilePath = path.join(packageDir, 'webpack.config.js');
              _context.next = 17;
              return readFile(webpackFilePath);

            case 17:
              webpackConfig = _context.sent;
              rulesMatch = webpackConfig.match(/rules\s*:\s*\[/);
              start = rulesMatch.index + rulesMatch[0].length;
              pointer = start - 1;
              brackets = 1;

            case 22:
              if (!(brackets > 0)) {
                _context.next = 31;
                break;
              }

              pointer += 1;
              if (webpackConfig[pointer] === '[') brackets += 1;
              if (webpackConfig[pointer] === ']') brackets -= 1;

              if (!(pointer > webpackConfig.length - 1)) {
                _context.next = 29;
                break;
              }

              pointer = -1;
              return _context.abrupt("break", 31);

            case 29:
              _context.next = 22;
              break;

            case 31:
              if (!(pointer === -1)) {
                _context.next = 34;
                break;
              }

              reject(new Error('Property `rules` was not found on webpack config'));
              return _context.abrupt("return");

            case 34:
              rules = "\n      {\n        test: /\\.js(x?)$/,\n        exclude: /node_modules/,\n        use: ['babel-loader'],\n      },\n    ";
              newWebpackConfig = "".concat(webpackConfig.slice(0, start)).concat(rules).concat(webpackConfig.slice(pointer));
              _context.next = 38;
              return writeFile(webpackFilePath, newWebpackConfig);

            case 38:
              _context.next = 43;
              break;

            case 40:
              _context.prev = 40;
              _context.t2 = _context["catch"](0);
              reject(_context.t2);

            case 43:
              resolve();

            case 44:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 40]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
};
/* =================================== */

/* Storybook
/* =================================== */


var installStorybook = function installStorybook(type) {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(resolve, reject) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return run('npm install -D @storybook/cli');

            case 3:
              _context2.next = 5;
              return run("./node_modules/.bin/sb init --type ".concat(type));

            case 5:
              _context2.next = 7;
              return run('npm install');

            case 7:
              _context2.next = 12;
              break;

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2["catch"](0);
              reject(_context2.t0);

            case 12:
              resolve();

            case 13:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[0, 9]]);
    }));

    return function (_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }());
};
/* =================================== */

/* MAIN
/* =================================== */


_asyncToGenerator(
/*#__PURE__*/
regeneratorRuntime.mark(function _callee3() {
  var interval, packageInfo, _groups2, _groups2$major, major, _groups2$minor, minor, _groups2$patch, patch, _groups2$label, label;

  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return inquirer.prompt([{
            type: 'input',
            name: 'packageName',
            message: 'Package name:',
            default: packageName
          }, {
            type: 'input',
            name: 'packageVersion',
            message: 'Version:',
            default: '0.1.0'
          }, {
            type: 'input',
            name: 'packageDescription',
            message: 'Description:',
            default: ''
          }, {
            type: 'input',
            name: 'packageKeywords',
            message: 'Keywords:',
            default: ''
          }, {
            type: 'list',
            name: 'dependencies.react',
            message: 'Use React?',
            default: options.r || options.react ? 'Yes' : 'No',
            choices: ['Yes', 'No']
          }, {
            type: 'list',
            name: 'dependencies.storybook',
            message: 'Use Storybook?',
            default: options.s || options.storybook ? 'Yes' : 'No',
            choices: ['Yes', 'No']
          }]);

        case 2:
          packageInfo = _context3.sent;

          /**
           * Check required configuration
           */
          if (!config.github.username) {
            log('\n');
            printWithBadge('warning', 'GitHub username is not set.');
            log(chalk.gray('Git repository initialization will be skipped'));
            log(chalk.gray('For more information: poop --help'));
            log('\n');
          }
          /**
           * Clean up the version string
           */


          _groups2 = (packageInfo.packageVersion.match(versionRegex) || {}).groups, _groups2$major = _groups2.major, major = _groups2$major === void 0 ? 0 : _groups2$major, _groups2$minor = _groups2.minor, minor = _groups2$minor === void 0 ? 0 : _groups2$minor, _groups2$patch = _groups2.patch, patch = _groups2$patch === void 0 ? 0 : _groups2$patch, _groups2$label = _groups2.label, label = _groups2$label === void 0 ? '' : _groups2$label;
          packageInfo.packageVersion = "".concat(major, ".").concat(minor, ".").concat(patch).concat(label);
          /**
           * Create the package directory if it does not exist
           */

          if (fs.existsSync(packageDir)) {
            _context3.next = 10;
            break;
          }

          fs.mkdirSync(packageDir);
          _context3.next = 12;
          break;

        case 10:
          _context3.next = 12;
          return cleanDir(packageDir, options.f || options.force);

        case 12:
          /**
           * Copy template files to target directory then process them
           */
          log(chalk.white('\nPooping files...'), false, false);
          _context3.prev = 13;
          _context3.next = 16;
          return copyTemplateFiles();

        case 16:
          _context3.next = 18;
          return processTemplateFiles(packageInfo);

        case 18:
          log(chalk.gray('Pooping files...'), true);
          _context3.next = 26;
          break;

        case 21:
          _context3.prev = 21;
          _context3.t0 = _context3["catch"](13);
          log("\n\nError:\n".concat(_context3.t0.message, "\n"));
          printWithBadge('error', 'Something went wrong, please contact the author.');
          process.exit(1);

        case 26:
          clearInterval(interval);
          /**
           * Attempt to initialize a git repository in the package directory
           */

          if (!config.github.username) {
            _context3.next = 39;
            break;
          }

          interval = ticker(chalk.white('Initializing git repository'));
          _context3.prev = 29;
          _context3.next = 32;
          return run('git init');

        case 32:
          log(chalk.gray('Initialized git repository.'), true);
          _context3.next = 38;
          break;

        case 35:
          _context3.prev = 35;
          _context3.t1 = _context3["catch"](29);
          printWithBadge('warning', 'Could not initialize a git repository.');

        case 38:
          clearInterval(interval);

        case 39:
          /**
           * Handle and install dependencies
           */
          interval = ticker(chalk.white('Installing dependencies'));
          _context3.prev = 40;
          process.chdir(packageDir);
          _context3.next = 44;
          return run('npm install');

        case 44:
          log(chalk.gray('Dependencies installed.'), true);
          _context3.next = 51;
          break;

        case 47:
          _context3.prev = 47;
          _context3.t2 = _context3["catch"](40);
          clearInterval(interval);
          throw _context3.t2;

        case 51:
          clearInterval(interval);
          /**
           * React
           */

          if (!(packageInfo.dependencies.react === 'Yes')) {
            _context3.next = 58;
            break;
          }

          interval = ticker(chalk.white('Installing React'));
          _context3.next = 56;
          return installReact();

        case 56:
          log(chalk.gray('React installed.'), true);
          clearInterval(interval);

        case 58:
          if (!(packageInfo.dependencies.storybook === 'Yes')) {
            _context3.next = 71;
            break;
          }

          interval = ticker(chalk.white('Installing Storybook'));
          _context3.prev = 60;
          _context3.next = 63;
          return installStorybook(options.react ? 'react' : 'html');

        case 63:
          log(chalk.gray('Storybook installed.'), true);
          _context3.next = 70;
          break;

        case 66:
          _context3.prev = 66;
          _context3.t3 = _context3["catch"](60);
          clearInterval(interval);
          throw _context3.t3;

        case 70:
          clearInterval(interval);

        case 71:
          /**
           * Done
           */
          log(chalk.gray('Done! 💩\n'));
          printWithBadge('success', 'Your project is ready, happy hacking!\n');

        case 73:
        case "end":
          return _context3.stop();
      }
    }
  }, _callee3, null, [[13, 21], [29, 35], [40, 47], [60, 66]]);
}))();