#! /usr/bin/env node
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

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
    options = (0, _objectWithoutProperties2.default)(argv, ["_"]);
var packageDir = path.join(process.cwd(), args[0] || '');
var packageName = path.basename(packageDir);
var templatesDir = path.join(__dirname, '../templates');
var versionRegex = /(\d+)\.?(\d+)?\.?(\d+)?(\w+)?/;
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
  return log("\nSpongepoop\nAn npm package template generator\n(c) Mostafa Fouad\n\nUsage:\n  poop [<package-directory> | <command>] [args]\n\nExample:\n  poop my-app --react --storybook\n\nTo set your GitHub username:\n  poop config --github.username=\"".concat(chalk.gray('<your-username>'), "\"\n\nArgs:\n  --help, -h           Print this help\n  --version, -v        Print version number\n  --react              Use React\n  --typescript         Use TypeScript\n  --storybook          Use StoryBook\n"));
};

if (options.help || options.h) {
  printHelp();
  process.exit(0);
}
/* =================================== */

/* Version
/* =================================== */


var printVersion = function printVersion() {
  var packageFile = fs.readFileSync(path.join(__dirname, '../package.json'));

  try {
    log(JSON.parse(packageFile).version);
  } catch (e) {
    printWithBadge('error', 'Invalid package file.');
  }
};

if (options.version || options.v) {
  printVersion();
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
/**
 * Renames a file
 * @param {String} filename Old filename
 * @param {String} newFilename  New filename
 */


var renameFile = function renameFile(filename, newFilename) {
  return promisify(fs.rename)(filename, newFilename);
};
/**
 * Updates webpack configuration file based on the given callback return value
 */


var configWebpack = function configWebpack(callback) {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(resolve, reject) {
      var webpackFilePath, webpackConfig, newWebpackConfig;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              webpackFilePath = path.join(packageDir, 'webpack.config.js');
              _context.next = 4;
              return readFile(webpackFilePath);

            case 4:
              webpackConfig = _context.sent;
              newWebpackConfig = callback(webpackConfig);
              _context.next = 8;
              return writeFile(webpackFilePath, newWebpackConfig);

            case 8:
              _context.next = 13;
              break;

            case 10:
              _context.prev = 10;
              _context.t0 = _context["catch"](0);
              reject(_context.t0);

            case 13:
              resolve();

            case 14:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 10]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
};
/**
 * Injects a set of webpack rules into the configuration file
 */


var injectWebpackRules = function injectWebpackRules(rules) {
  return configWebpack(function (webpackConfig) {
    var rulesMatch = webpackConfig.match(/rules\s*:\s*\[/);
    var start = rulesMatch.index + rulesMatch[0].length;
    var pointer = start - 1;
    var brackets = 1;

    while (brackets > 0) {
      pointer += 1;
      if (webpackConfig[pointer] === '[') brackets += 1;
      if (webpackConfig[pointer] === ']') brackets -= 1;

      if (pointer > webpackConfig.length - 1) {
        pointer = -1;
        break;
      }
    }

    if (pointer === -1) {
      throw new Error('Property `rules` was not found on webpack config');
    }

    var currentRules = webpackConfig.slice(start, pointer);
    var newRules = "".concat(currentRules).concat(rules).replace(/\n+\s+\n+/, '\n');
    return "".concat(webpackConfig.slice(0, start)).concat(newRules).concat(webpackConfig.slice(pointer));
  });
};
/* =================================== */

/* Templates
/* =================================== */


var copyTemplateFiles = function copyTemplateFiles(files) {
  return new Promise(function (resolve, reject) {
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
        var processedContent = content.replace(/<github-username>/g, config.github.username || '<github-username>').replace(/<package-name>/g, info.packageName).replace(/<package-version>/g, info.packageVersion).replace(/<package-description>/g, info.packageDescription);
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
    var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(resolve, reject) {
      var babelFilePath, babelConfig;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return run('npm install react react-dom prop-types');

            case 3:
              _context2.next = 5;
              return run('npm install -D @babel/preset-react babel-loader');

            case 5:
              babelFilePath = path.join(packageDir, '.babelrc');
              _context2.t0 = JSON;
              _context2.next = 9;
              return readFile(babelFilePath);

            case 9:
              _context2.t1 = _context2.sent;
              babelConfig = _context2.t0.parse.call(_context2.t0, _context2.t1);
              babelConfig.presets.push('@babel/preset-react');
              _context2.next = 14;
              return writeFile(babelFilePath, JSON.stringify(babelConfig, null, 2));

            case 14:
              _context2.next = 16;
              return injectWebpackRules("\n      {\n        test: /\\.js(x?)$/,\n        exclude: /node_modules/,\n        use: ['babel-loader'],\n      },\n    ");

            case 16:
              _context2.next = 21;
              break;

            case 18:
              _context2.prev = 18;
              _context2.t2 = _context2["catch"](0);
              reject(_context2.t2);

            case 21:
              resolve();

            case 22:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[0, 18]]);
    }));

    return function (_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }());
};
/* =================================== */

/* TypeScript
/* =================================== */


var installTypeScript = function installTypeScript() {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref3 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(resolve, reject) {
      var eslintFilePath, eslintConfig, packageFilePath, packageConfig, babelFilePath, babelConfig, entryFilePath;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return run('npm install -D typescript ts-loader');

            case 3:
              _context3.next = 5;
              return run('npm install -D @types/react @types/react-dom');

            case 5:
              _context3.next = 7;
              return run('npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin');

            case 7:
              _context3.next = 9;
              return run('npm install -D eslint-config-airbnb-typescript');

            case 9:
              _context3.next = 11;
              return run('npm install -D @babel/preset-typescript');

            case 11:
              eslintFilePath = path.join(packageDir, '.eslintrc');
              _context3.t0 = JSON;
              _context3.next = 15;
              return readFile(eslintFilePath);

            case 15:
              _context3.t1 = _context3.sent;
              eslintConfig = _context3.t0.parse.call(_context3.t0, _context3.t1);
              eslintConfig.parser = '@typescript-eslint/parser';
              eslintConfig.extends = 'airbnb-typescript';
              eslintConfig.plugins = eslintConfig.plugins || [];
              eslintConfig.plugins.push('@typescript-eslint');
              _context3.next = 23;
              return writeFile(eslintFilePath, JSON.stringify(eslintConfig, null, 2));

            case 23:
              packageFilePath = path.join(packageDir, 'package.json');
              _context3.t2 = JSON;
              _context3.next = 27;
              return readFile(packageFilePath);

            case 27:
              _context3.t3 = _context3.sent;
              packageConfig = _context3.t2.parse.call(_context3.t2, _context3.t3);
              packageConfig.scripts.lint = packageConfig.scripts.lint.replace(/\.js/g, '.ts');
              _context3.next = 32;
              return writeFile(packageFilePath, JSON.stringify(packageConfig, null, 2));

            case 32:
              babelFilePath = path.join(packageDir, '.babelrc');
              _context3.t4 = JSON;
              _context3.next = 36;
              return readFile(babelFilePath);

            case 36:
              _context3.t5 = _context3.sent;
              babelConfig = _context3.t4.parse.call(_context3.t4, _context3.t5);
              babelConfig.presets.push('@babel/preset-typescript');
              _context3.next = 41;
              return writeFile(babelFilePath, JSON.stringify(babelConfig, null, 2));

            case 41:
              _context3.next = 43;
              return injectWebpackRules("\n      {\n        test: /\\.ts(x?)$/,\n        exclude: /node_modules/,\n        use: ['ts-loader'],\n      },\n    ");

            case 43:
              _context3.next = 45;
              return copyTemplateFiles(['$tsconfig.json']);

            case 45:
              entryFilePath = path.join(packageDir, 'src/index.js');
              _context3.next = 48;
              return renameFile(entryFilePath, 'src/index.ts');

            case 48:
              configWebpack(function (webpackConfig) {
                return webpackConfig.replace(/\.\/src\/index.js/g, './src/index.ts');
              });
              _context3.next = 54;
              break;

            case 51:
              _context3.prev = 51;
              _context3.t6 = _context3["catch"](0);
              reject(_context3.t6);

            case 54:
              resolve();

            case 55:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[0, 51]]);
    }));

    return function (_x5, _x6) {
      return _ref3.apply(this, arguments);
    };
  }());
};
/* =================================== */

/* Storybook
/* =================================== */


var installStorybook = function installStorybook(dependencies) {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref4 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4(resolve, reject) {
      var type;
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              type = dependencies.react === 'Yes' ? 'react' : 'html';
              _context4.next = 4;
              return run('npm install -D @storybook/cli');

            case 4:
              _context4.next = 6;
              return run('npm install -D @types/node');

            case 6:
              _context4.next = 8;
              return run("./node_modules/.bin/sb init --type ".concat(type));

            case 8:
              _context4.next = 10;
              return run('npm install');

            case 10:
              if (!(dependencies.typescript === 'Yes')) {
                _context4.next = 17;
                break;
              }

              _context4.next = 13;
              return copyFile(path.join(templatesDir, '.storybook-typescript/webpack.config.js'), path.join(packageDir, '.storybook/webpack.config.js'));

            case 13:
              _context4.next = 15;
              return copyFile(path.join(templatesDir, '.storybook-typescript/config.js'), path.join(packageDir, '.storybook/config.js'));

            case 15:
              _context4.next = 17;
              return renameFile(path.join(packageDir, 'stories/index.stories.js'), path.join(packageDir, 'stories/index.stories.tsx'));

            case 17:
              _context4.next = 22;
              break;

            case 19:
              _context4.prev = 19;
              _context4.t0 = _context4["catch"](0);
              reject(_context4.t0);

            case 22:
              resolve();

            case 23:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, null, [[0, 19]]);
    }));

    return function (_x7, _x8) {
      return _ref4.apply(this, arguments);
    };
  }());
};
/* =================================== */

/* MAIN
/* =================================== */


(0, _asyncToGenerator2.default)(
/*#__PURE__*/
_regenerator.default.mark(function _callee5() {
  var interval, packageInfo, _ref6, _ref7, _ref7$, major, _ref7$2, minor, _ref7$3, patch, _ref7$4, label, templateFiles;

  return _regenerator.default.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
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
            default: options.react ? 'Yes' : 'No',
            choices: ['Yes', 'No']
          }, {
            type: 'list',
            name: 'dependencies.typescript',
            message: 'Use TypeScript?',
            default: options.typescript ? 'Yes' : 'No',
            choices: ['Yes', 'No']
          }, {
            type: 'list',
            name: 'dependencies.storybook',
            message: 'Use Storybook?',
            default: options.storybook ? 'Yes' : 'No',
            choices: ['Yes', 'No']
          }]);

        case 2:
          packageInfo = _context5.sent;

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


          _ref6 = packageInfo.packageVersion.match(versionRegex) || [], _ref7 = (0, _slicedToArray2.default)(_ref6, 5), _ref7$ = _ref7[1], major = _ref7$ === void 0 ? 0 : _ref7$, _ref7$2 = _ref7[2], minor = _ref7$2 === void 0 ? 0 : _ref7$2, _ref7$3 = _ref7[3], patch = _ref7$3 === void 0 ? 0 : _ref7$3, _ref7$4 = _ref7[4], label = _ref7$4 === void 0 ? '' : _ref7$4;
          packageInfo.packageVersion = "".concat(major, ".").concat(minor, ".").concat(patch).concat(label);
          /**
           * Create the package directory if it does not exist
           */

          if (fs.existsSync(packageDir)) {
            _context5.next = 10;
            break;
          }

          fs.mkdirSync(packageDir);
          _context5.next = 12;
          break;

        case 10:
          _context5.next = 12;
          return cleanDir(packageDir, options.f || options.force);

        case 12:
          /**
           * Copy template files to target directory then process them
           */
          log(chalk.white('\nPooping files...'), false, false);
          templateFiles = ['src', 'tests', '$.babelrc', '$.editorconfig', '$.eslintrc', '$.gitignore', '$.travis.yml', '$LICENSE', '$package.json', '$README.md', '$webpack.config.js'];
          _context5.prev = 14;
          _context5.next = 17;
          return copyTemplateFiles(templateFiles);

        case 17:
          _context5.next = 19;
          return processTemplateFiles(packageInfo);

        case 19:
          log(chalk.gray('Pooping files...'), true);
          _context5.next = 27;
          break;

        case 22:
          _context5.prev = 22;
          _context5.t0 = _context5["catch"](14);
          log("\n\nError:\n".concat(_context5.t0.message, "\n"));
          printWithBadge('error', 'Something went wrong, please contact the author.');
          process.exit(1);

        case 27:
          clearInterval(interval);
          /**
           * Attempt to initialize a git repository in the package directory
           */

          if (!config.github.username) {
            _context5.next = 40;
            break;
          }

          interval = ticker(chalk.white('Initializing git repository'));
          _context5.prev = 30;
          _context5.next = 33;
          return run('git init');

        case 33:
          log(chalk.gray('Initialized git repository.'), true);
          _context5.next = 39;
          break;

        case 36:
          _context5.prev = 36;
          _context5.t1 = _context5["catch"](30);
          printWithBadge('warning', 'Could not initialize a git repository.');

        case 39:
          clearInterval(interval);

        case 40:
          /**
           * Handle and install dependencies
           */
          interval = ticker(chalk.white('Installing dependencies'));
          _context5.prev = 41;
          process.chdir(packageDir);
          _context5.next = 45;
          return run('npm install');

        case 45:
          log(chalk.gray('Dependencies installed.'), true);
          _context5.next = 52;
          break;

        case 48:
          _context5.prev = 48;
          _context5.t2 = _context5["catch"](41);
          clearInterval(interval);
          throw _context5.t2;

        case 52:
          clearInterval(interval);
          /**
           * React
           */

          if (!(packageInfo.dependencies.react === 'Yes')) {
            _context5.next = 59;
            break;
          }

          interval = ticker(chalk.white('Installing React'));
          _context5.next = 57;
          return installReact();

        case 57:
          log(chalk.gray('React installed.'), true);
          clearInterval(interval);

        case 59:
          if (!(packageInfo.dependencies.typescript === 'Yes')) {
            _context5.next = 65;
            break;
          }

          interval = ticker(chalk.white('Installing TypeScript'));
          _context5.next = 63;
          return installTypeScript();

        case 63:
          log(chalk.gray('TypeScript installed.'), true);
          clearInterval(interval);

        case 65:
          if (!(packageInfo.dependencies.storybook === 'Yes')) {
            _context5.next = 78;
            break;
          }

          interval = ticker(chalk.white('Installing Storybook'));
          _context5.prev = 67;
          _context5.next = 70;
          return installStorybook(packageInfo.dependencies);

        case 70:
          log(chalk.gray('Storybook installed.'), true);
          _context5.next = 77;
          break;

        case 73:
          _context5.prev = 73;
          _context5.t3 = _context5["catch"](67);
          clearInterval(interval);
          throw _context5.t3;

        case 77:
          clearInterval(interval);

        case 78:
          /**
           * Done
           */
          log(chalk.gray('Done! 💩\n'));
          printWithBadge('success', 'Your project is ready, happy hacking!\n');

        case 80:
        case "end":
          return _context5.stop();
      }
    }
  }, _callee5, null, [[14, 22], [30, 36], [41, 48], [67, 73]]);
}))();