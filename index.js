const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const R = require('ramda');

const ifElseP = (conditionP, onTrue, onFalse) => async arg => (
  await conditionP(arg) ? onTrue(arg) : onFalse(arg)
);

const isDirectory = dir => new Promise((resolve) => {
  fs.stat(dir, (err, stat) => {
    if (err) throw err;

    resolve(stat.isDirectory());
  });
});

const getChildrenFromDirectory = directory => new Promise((resolve) => {
  fs.readdir(directory, (err, children) => {
    if (err) throw err;

    resolve(
      children.map(child => path.join(directory, child)),
    );
  });
});

const filterExcludedFileExt = includedExt => files => (
  files.filter(file => R.contains(path.extname(file), includedExt))
);

const expandSubDirectories = children => Promise.all(
  R.map(
    ifElseP(
      isDirectory,
      getFilesRecursive, // eslint-disable-line no-use-before-define,
      R.identity,
    ),
    children,
  ),
);

const getFilesRecursive = dir => R.pipeP(
  getChildrenFromDirectory,
  expandSubDirectories,
  R.flatten,
  filterExcludedFileExt(['.js']),
)(dir);

getFilesRecursive('./App').then(d => console.log(d));

const removeFile = filePath => new Promise((resolve) => {
  fs.unlink(filePath, (err) => {
    if (err) throw err;

    resolve();
  });
});

const removeDir = dirPath => new Promise((resolve) => {
  rimraf(dirPath, (err) => {
    if (err) throw err;

    resolve();
  });
});

const removeFileOrDirectory = async inputPath => R.ifElse(
  await isDirectory,
  await removeDir,
  await removeFile,
)(inputPath);

module.exports = {
  getFilesRecursive,
  removeFileOrDirectory,
};
