#! /usr/bin/env node

const fs = require('fs');
const ncp = require('ncp');
const rimraf = require('rimraf');
const util = require('util');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const execCmd = require('child_process').exec;
const argv = require('minimist')(process.argv.slice(2));

/* =================================== */
/* Definitions and stuff
/* =================================== */

const { promisify } = util;

const {
  _: args,
  ...options
} = argv;

const packageDir = path.join(process.cwd(), args[0] || '');
const packageName = path.basename(packageDir);
const templatesDir = path.join(__dirname, '../templates');
const versionRegex = /(\d+)\.?(\d+)?\.?(\d+)?(\w+)?/;

/* =================================== */
/* Logging
/* =================================== */

/**
 * Clears last line. (duh!)
 */
const clearLastLine = () => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};

/**
 * Inserts a new line. (duh!)
 */
const insertNewLine = () => {
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
const log = (text, clearLast = false, breakAfter = true) => {
  if (clearLast) clearLastLine();
  process.stdout.write(text);
  if (breakAfter) insertNewLine();
};

/**
 * Outputs a line and adds an animated ellipsis at the end of the line.
 * @param {String} text Text to output
 */
const ticker = (text) => {
  let i = 0;

  return setInterval(() => {
    log(`${text}${'.'.repeat(i % 4)}`, i > 0, false);
    i += 1;
  }, 200);
};

/**
 * Outputs a line and optionally prepends a badge.
 * @param {String}  type          One of: success | error | warning | info
 * @param {String}  text          Text to output
 * @param {Boolean} includeBadge  Whether to prepend a badge to the text
 */
const printWithBadge = (type, text, includeBadge = true) => {
  const badgeColors = {
    error: ['white', 'red'],
    success: ['black', 'green'],
    warning: ['black', 'yellow'],
    info: ['black', 'cyanBright'],
  };

  const colorFunc = badgeColors[type][1];
  const bgColorFunc = `bg${colorFunc[0].toUpperCase()}${colorFunc.slice(1)}`;

  if (includeBadge) {
    log(`${chalk[badgeColors[type][0]][bgColorFunc](` ${type} `)} `, false, false);
  }

  log(chalk[colorFunc](text));
};

/* =================================== */
/* Help
/* =================================== */
const printHelp = () => log(`
Spongepoop
An npm package template generator
(c) Mostafa Fouad

Usage:
  poop [<package-directory> | <command>] [args]

Example:
  poop my-app --react --storybook

To set your GitHub username:
  poop config --github.username="${chalk.gray('<your-username>')}"

Args:
  --help, -h           Print this help
  --version, -v        Print version number
  --react              Use React
  --typescript         Use TypeScript
  --storybook          Use StoryBook
`);

if (options.help || options.h) {
  printHelp();
  process.exit(0);
}

/* =================================== */
/* Version
/* =================================== */

const printVersion = () => {
  const packageFile = fs.readFileSync(path.join(__dirname, '../package.json'));

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

const loadConfig = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../data/config.json')));
const saveConfig = data => fs.writeFileSync(path.join(__dirname, '../data/config.json'), JSON.stringify(data, null, 2), 'utf8');

/**
 * Get configuration
 */
const config = loadConfig();

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
const run = command => new Promise((resolve, reject) => {
  execCmd(command, (err) => {
    if (err) reject(err);
    resolve();
  });
});

/**
 * Deletes files in a directory showing a prompt first.
 * @param {String} dir Path to the directory
 * @returns {Promise}
 */
const cleanDir = (dirPath, force = false) => new Promise((resolve, reject) => {
  const cleanDirConfirmed = () => {
    rimraf(path.join(dirPath, '{*,.*}'), (rimrafErr) => {
      if (rimrafErr) reject(rimrafErr);
      resolve();
    });
  };

  if (force) {
    cleanDirConfirmed();
    return;
  }

  fs.readdir(dirPath, (err, files) => {
    if (err) reject(err);

    if (files.length > 0) {
      inquirer
        .prompt([
          {
            type: 'list',
            name: 'confirmed',
            message: `Destination will be emptied, continue?\n${chalk.gray(dirPath)}`,
            default: 'No',
            choices: ['Yes', 'No'],
          },
        ])
        .then((answers) => {
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

/**
 * Copies a file to a certain destination.
 * @param {String} filePath         Target file to copy
 * @param {String} destinationPath  Destination to copy the file to
 */
const copyFile = (filePath, destinationPath) => new Promise((resolve, reject) => {
  ncp(filePath, destinationPath, (err) => {
    if (err) reject(err);
    resolve();
  });
});

/**
 * Reads from file
 * @param {String} filePath Path to the file
 */
const readFile = filePath => promisify(fs.readFile)(filePath, 'utf8');

/**
 * Writes data to file
 * @param {String} filePath Path to the file
 * @param {String} content  Data to write
 */
const writeFile = (filePath, content) => promisify(fs.writeFile)(filePath, content, 'utf8');

/**
 * Renames a file
 * @param {String} filename Old filename
 * @param {String} newFilename  New filename
 */
const renameFile = (filename, newFilename) => promisify(fs.rename)(filename, newFilename);

/**
 * Updates webpack configuration file based on the given callback return value
 */
const configWebpack = callback => new Promise(async (resolve, reject) => {
  try {
    const webpackFilePath = path.join(packageDir, 'webpack.config.js');
    const webpackConfig = await readFile(webpackFilePath);
    const newWebpackConfig = callback(webpackConfig);
    await writeFile(webpackFilePath, newWebpackConfig);
  } catch (e) {
    reject(e);
  }

  resolve();
});

/**
 * Injects a set of webpack rules into the configuration file
 */
const injectWebpackRules = rules => configWebpack((webpackConfig) => {
  const rulesMatch = webpackConfig.match(/rules\s*:\s*\[/);
  const start = rulesMatch.index + rulesMatch[0].length;

  let pointer = start - 1;
  let brackets = 1;

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

  const currentRules = webpackConfig.slice(start, pointer);
  const newRules = `${currentRules}${rules}`.replace(/\n+\s+\n+/, '\n');
  return `${webpackConfig.slice(0, start)}${newRules}${webpackConfig.slice(pointer)}`;
});

/* =================================== */
/* Templates
/* =================================== */

const copyTemplateFiles = files => new Promise((resolve, reject) => {
  (function copyTemplateFile(fileName) {
    copyFile(
      path.join(templatesDir, fileName),
      path.join(packageDir, fileName.replace(/^\$/, '')),
    ).then(() => {
      if (files.length) {
        copyTemplateFile(files.shift());
      } else {
        resolve();
      }
    }).catch(reject);
  }(files.shift()));
});

const templateFileHandlers = {};

const processTemplateFiles = info => new Promise((resolve, reject) => {
  const files = fs.readdirSync(packageDir).filter(fileName => typeof templateFileHandlers[fileName] !== 'undefined');

  if (files.length === 0) resolve();

  (function processTemplateFile(fileName) {
    const filePath = path.join(packageDir, fileName);

    readFile(filePath)
      .then((content) => {
        let processedContent = content
          .replace(/<github-username>/g, config.github.username || '<github-username>')
          .replace(/<package-name>/g, info.packageName)
          .replace(/<package-version>/g, info.packageVersion)
          .replace(/<package-description>/g, info.packageDescription);

        processedContent = templateFileHandlers[fileName](processedContent, info);

        writeFile(filePath, processedContent)
          .then(() => {
            if (files.length) {
              processTemplateFile(files.shift());
            } else {
              resolve();
            }
          })
          .catch(reject);
      })
      .catch(reject);
  }(files.shift()));
});

const addTemplateFileHandler = (filename, handler) => {
  templateFileHandlers[filename] = typeof handler === 'function' ? handler : v => v;
};

addTemplateFileHandler('package.json', (content, info) => {
  const data = JSON.parse(content);

  if (!info.packageKeywords.trim()) {
    delete data.keywords;
  } else {
    data.keywords = info.packageKeywords.trim().split(/,+/).map(v => v.trim());
  }

  return JSON.stringify(data, null, 2);
});

addTemplateFileHandler('README.md', true);

/* =================================== */
/* React
/* =================================== */

const installReact = () => new Promise(async (resolve, reject) => {
  try {
    await run('npm install react react-dom prop-types');
    await run('npm install -D @babel/preset-react babel-loader');

    const babelFilePath = path.join(packageDir, '.babelrc');
    const babelConfig = JSON.parse(await readFile(babelFilePath));
    babelConfig.presets.push('@babel/preset-react');
    await writeFile(babelFilePath, JSON.stringify(babelConfig, null, 2));

    await injectWebpackRules(`
      {
        test: /\\.js(x?)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    `);
  } catch (e) {
    reject(e);
  }

  resolve();
});

/* =================================== */
/* TypeScript
/* =================================== */

const installTypeScript = () => new Promise(async (resolve, reject) => {
  try {
    await run('npm install -D typescript ts-loader');
    await run('npm install -D @types/react @types/react-dom');
    await run('npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin');
    await run('npm install -D eslint-config-airbnb-typescript');
    await run('npm install -D @babel/preset-typescript');

    const eslintFilePath = path.join(packageDir, '.eslintrc');
    const eslintConfig = JSON.parse(await readFile(eslintFilePath));
    eslintConfig.parser = '@typescript-eslint/parser';
    eslintConfig.extends = 'airbnb-typescript';
    eslintConfig.plugins = eslintConfig.plugins || [];
    eslintConfig.plugins.push('@typescript-eslint');
    await writeFile(eslintFilePath, JSON.stringify(eslintConfig, null, 2));

    const packageFilePath = path.join(packageDir, 'package.json');
    const packageConfig = JSON.parse(await readFile(packageFilePath));
    packageConfig.scripts.lint = packageConfig.scripts.lint.replace(/\.js/g, '.ts');
    await writeFile(packageFilePath, JSON.stringify(packageConfig, null, 2));

    const babelFilePath = path.join(packageDir, '.babelrc');
    const babelConfig = JSON.parse(await readFile(babelFilePath));
    babelConfig.presets.push('@babel/preset-typescript');
    await writeFile(babelFilePath, JSON.stringify(babelConfig, null, 2));

    await injectWebpackRules(`
      {
        test: /\\.ts(x?)$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
    `);

    await copyTemplateFiles(['$tsconfig.json']);

    const entryFilePath = path.join(packageDir, 'src/index.js');
    await renameFile(entryFilePath, 'src/index.ts');

    configWebpack(webpackConfig => webpackConfig.replace(/\.\/src\/index.js/g, './src/index.ts'));
  } catch (e) {
    reject(e);
  }

  resolve();
});

/* =================================== */
/* Storybook
/* =================================== */

const installStorybook = dependencies => new Promise(async (resolve, reject) => {
  try {
    const type = dependencies.react === 'Yes' ? 'react' : 'html';
    await run('npm install -D @storybook/cli');
    await run('npm install -D @types/node');
    await run(`./node_modules/.bin/sb init --type ${type}`);
    await run('npm install');

    if (dependencies.typescript === 'Yes') {
      await copyFile(
        path.join(templatesDir, '.storybook-typescript/webpack.config.js'),
        path.join(packageDir, '.storybook/webpack.config.js'),
      );

      await copyFile(
        path.join(templatesDir, '.storybook-typescript/config.js'),
        path.join(packageDir, '.storybook/config.js'),
      );

      await renameFile(
        path.join(packageDir, 'stories/index.stories.js'),
        path.join(packageDir, 'stories/index.stories.tsx'),
      );
    }
  } catch (e) {
    reject(e);
  }

  resolve();
});

/* =================================== */
/* MAIN
/* =================================== */

(async () => {
  let interval;

  /**
   * Get package info
   */
  const packageInfo = await inquirer
    .prompt([
      {
        type: 'input',
        name: 'packageName',
        message: 'Package name:',
        default: packageName,
      },
      {
        type: 'input',
        name: 'packageVersion',
        message: 'Version:',
        default: '0.1.0',
      },
      {
        type: 'input',
        name: 'packageDescription',
        message: 'Description:',
        default: '',
      },
      {
        type: 'input',
        name: 'packageKeywords',
        message: 'Keywords:',
        default: '',
      },
      {
        type: 'list',
        name: 'dependencies.react',
        message: 'Use React?',
        default: options.react ? 'Yes' : 'No',
        choices: ['Yes', 'No'],
      },
      {
        type: 'list',
        name: 'dependencies.typescript',
        message: 'Use TypeScript?',
        default: options.typescript ? 'Yes' : 'No',
        choices: ['Yes', 'No'],
      },
      {
        type: 'list',
        name: 'dependencies.storybook',
        message: 'Use Storybook?',
        default: options.storybook ? 'Yes' : 'No',
        choices: ['Yes', 'No'],
      },
    ]);

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
  const [,
    major = 0,
    minor = 0,
    patch = 0,
    label = '',
  ] = (packageInfo.packageVersion.match(versionRegex) || []);

  packageInfo.packageVersion = `${major}.${minor}.${patch}${label}`;

  /**
   * Create the package directory if it does not exist
   */
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir);
  } else {
    await cleanDir(packageDir, options.f || options.force);
  }

  /**
   * Copy template files to target directory then process them
   */
  log(chalk.white('\nPooping files...'), false, false);

  const templateFiles = [
    'src',
    'tests',
    '$.babelrc',
    '$.editorconfig',
    '$.eslintrc',
    '$.gitignore',
    '$.travis.yml',
    '$LICENSE',
    '$package.json',
    '$README.md',
    '$webpack.config.js',
  ];

  try {
    await copyTemplateFiles(templateFiles);
    await processTemplateFiles(packageInfo);
    log(chalk.gray('Pooping files...'), true);
  } catch (e) {
    log(`\n\nError:\n${e.message}\n`);
    printWithBadge('error', 'Something went wrong, please contact the author.');
    process.exit(1);
  }

  clearInterval(interval);

  /**
   * Attempt to initialize a git repository in the package directory
   */
  if (config.github.username) {
    interval = ticker(chalk.white('Initializing git repository'));

    try {
      await run('git init');
      log(chalk.gray('Initialized git repository.'), true);
    } catch (e) {
      printWithBadge('warning', 'Could not initialize a git repository.');
    }

    clearInterval(interval);
  }

  /**
   * Handle and install dependencies
   */
  interval = ticker(chalk.white('Installing dependencies'));

  try {
    process.chdir(packageDir);
    await run('npm install');
    log(chalk.gray('Dependencies installed.'), true);
  } catch (e) {
    clearInterval(interval);
    throw e;
  }

  clearInterval(interval);

  /**
   * React
   */
  if (packageInfo.dependencies.react === 'Yes') {
    interval = ticker(chalk.white('Installing React'));
    await installReact();
    log(chalk.gray('React installed.'), true);
    clearInterval(interval);
  }

  /**
   * TypeScript
   */
  if (packageInfo.dependencies.typescript === 'Yes') {
    interval = ticker(chalk.white('Installing TypeScript'));
    await installTypeScript();
    log(chalk.gray('TypeScript installed.'), true);
    clearInterval(interval);
  }

  /**
   * Storybook
   */
  if (packageInfo.dependencies.storybook === 'Yes') {
    interval = ticker(chalk.white('Installing Storybook'));

    try {
      await installStorybook(packageInfo.dependencies);
      log(chalk.gray('Storybook installed.'), true);
    } catch (e) {
      clearInterval(interval);
      throw e;
    }

    clearInterval(interval);
  }

  /**
   * Done
   */
  log(chalk.gray('Done! 💩\n'));
  printWithBadge('success', 'Your project is ready, happy hacking!\n');
})();
