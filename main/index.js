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
  --yes, -y            Accept all options
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
 * Updates contents of a file
 * @param {String} filePath Path to the file
 * @param {Function} updater A function that receives old file contents and returns new file content
 */
const updateFile = (filePath, updater) => new Promise(async (resolve, reject) => {
  try {
    const isJSON = /\.json$/.test(filePath);
    const content = await readFile(filePath);
    const newContent = updater(isJSON ? JSON.parse(content) : content);
    await writeFile(filePath, isJSON ? JSON.stringify(newContent, null, 2) : newContent);
    resolve(newContent);
  } catch (e) {
    reject(e);
  }
});

/**
 * Renames a file
 * @param {String} filename Old filename
 * @param {String} newFilename  New filename
 */
const renameFile = (filename, newFilename) => promisify(fs.rename)(filename, newFilename);

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
 * Reads a directory
 * @param {String} dirPath Path to the directory
 */
const readDir = dirPath => promisify(fs.readdir)(dirPath, 'utf8');

/* =================================== */
/* Templates
/* =================================== */

const templateFileHandlers = {};

const addTemplateFileForProcessing = (filename, handler) => {
  templateFileHandlers[filename] = typeof handler === 'function' ? handler : v => v;
};

const copyTemplateFiles = files => new Promise((resolve, reject) => {
  (function copyTemplateFile(filename) {
    copyFile(
      path.join(templatesDir, filename),
      path.join(packageDir, filename.replace(/^\$/, '')),
    ).then(() => {
      if (files.length) {
        copyTemplateFile(files.shift());
      } else {
        resolve();
      }
    }).catch(reject);
  }(files.shift()));
});

const processTemplateFiles = info => new Promise((resolve, reject) => {
  const files = fs.readdirSync(packageDir).filter(filename => typeof templateFileHandlers[filename] !== 'undefined');

  if (files.length === 0) resolve();

  (async function processTemplateFile(filename) {
    await updateFile(filename, (fileContent) => {
      let processedContent = JSON.stringify(fileContent, null, 2)
        .replace(/<github-username>/g, config.github.username || '<github-username>')
        .replace(/<package-name>/g, info.packageName)
        .replace(/<package-version>/g, info.packageVersion)
        .replace(/<package-description>/g, info.packageDescription);

      processedContent = templateFileHandlers[filename](processedContent, info);

      return JSON.parse(processedContent);
    }).catch(reject);

    if (files.length > 0) {
      await processTemplateFile(files.shift());
    } else {
      resolve();
    }
  }(files.shift()));
});

addTemplateFileForProcessing('package.json', (content, info) => {
  const data = JSON.parse(content);

  if (!info.packageKeywords.trim()) {
    delete data.keywords;
  } else {
    data.keywords = info.packageKeywords.trim().split(/,+/).map(v => v.trim());
  }

  return JSON.stringify(data, null, 2);
});

addTemplateFileForProcessing('README.md');

/* =================================== */
/* React
/* =================================== */

const installReact = () => new Promise(async (resolve, reject) => {
  try {
    await run('npm install react react-dom prop-types');
    fs.unlinkSync(path.join(packageDir, 'src/index.js'));
    await copyFile(path.join(templatesDir, 'src/index.jsx'), path.join(packageDir, 'src/index.jsx'));
    await updateFile(path.join(packageDir, 'index.html'), content => content.replace('src/index.js', 'src/index.jsx'));
  } catch (e) {
    reject(e);
  }

  resolve();
});

/* =================================== */
/* TypeScript
/* =================================== */

const installTypeScript = dependencies => new Promise(async (resolve, reject) => {
  try {
    let sourceFile = 'src/index.js';
    let typescriptSourceFile = 'src/index.ts';

    if (options.react || dependencies.react === 'Yes') {
      sourceFile = 'src/index.jsx';
      typescriptSourceFile = 'src/index.tsx';
    }

    fs.unlinkSync(path.join(packageDir, sourceFile));

    await copyFile(
      path.join(templatesDir, typescriptSourceFile),
      path.join(packageDir, typescriptSourceFile),
    );

    await updateFile(path.join(packageDir, 'index.html'), content => content.replace(sourceFile, typescriptSourceFile));
    await copyFile(path.join(templatesDir, '$tsconfig.json'), path.join(packageDir, 'tsconfig.json'));
    await run('npm install -D typescript');
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
    const type = (options.react || dependencies.react === 'Yes') ? 'react' : 'html';
    await run('npm install -D @storybook/cli');
    await run(`./node_modules/.bin/sb init --type ${type}`);
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
    ].filter(question => !(question.name.match(/^dependencies\./) && options[question.name.split('.')[1]])));

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
    await cleanDir(packageDir, options.force || options.f);
  }

  fs.mkdirSync(path.join(packageDir, 'src'));
  fs.mkdirSync(path.join(packageDir, 'tests'));

  /**
   * Copy template files to target directory then process them
   */
  log(chalk.white('\nPooping files...'), false, false);

  const templateFiles = [
    'src/index.js',
    'tests',
    '$.editorconfig',
    '$.eslintrc',
    '$.gitignore',
    '$.travis.yml',
    '$index.html',
    '$LICENSE',
    '$package.json',
    '$README.md',
  ];

  try {
    log(chalk.gray('Pooping files...'), true);

    await copyTemplateFiles(templateFiles)
      .catch(e => log(chalk.red('Could not copy template files!', e)));

    await processTemplateFiles(packageInfo)
      .catch(e => log(chalk.red('Could not process template files!', e)));
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
   * React
   */
  if (options.react || packageInfo.dependencies.react === 'Yes') {
    interval = ticker(chalk.white('Installing React'));
    await installReact();
    log(chalk.gray('React installed.'), true);
    clearInterval(interval);
  }

  /**
   * TypeScript
   */
  if (options.typescript || packageInfo.dependencies.typescript === 'Yes') {
    interval = ticker(chalk.white('Installing TypeScript'));
    await installTypeScript(packageInfo.dependencies);
    log(chalk.gray('TypeScript installed.'), true);
    clearInterval(interval);
  }

  /**
   * Storybook
   */
  if (options.storybook || packageInfo.dependencies.storybook === 'Yes') {
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
   * Handle and install dependencies
   */

  interval = ticker(chalk.white('Installing dependencies'));

  try {
    await run('npm install');
    log(chalk.gray('Dependencies installed.'), true);
  } catch (e) {
    clearInterval(interval);
    throw e;
  }

  clearInterval(interval);

  /**
   * Done
   */
  log(chalk.gray('Done! 💩\n'));
  printWithBadge('success', 'Your project is ready, happy hacking!\n');
})();
