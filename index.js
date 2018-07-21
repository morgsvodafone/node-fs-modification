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

const expandSubDirectoriesRecursive = async dir => Promise.all(
  R.map(
    ifElseP(
      isDirectory,
      expandSubDirectoriesRecursive,
      R.identity,
    ),
    await getChildrenFromDirectory(dir),
  ),
);

const filterExcludedFileExt = (includedExt = []) => files => (
  files.filter(file => R.contains(path.extname(file), includedExt))
);

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

const getFiles = ({ dir = '.', includedExt }) => R.pipeP(
  expandSubDirectoriesRecursive,
  R.flatten,
  filterExcludedFileExt(includedExt),
)(dir);

module.exports = {
  removeFileOrDirectory,
  getFiles,
};
