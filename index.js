const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const R = require('ramda');

const filterP = (funcP, arr) => (
  R.pipeP(
    ...arr.map(el => output => funcP(el).then(
      outputBool => Promise.resolve(
        outputBool ? R.append(el, output) : output,
      ),
    )),
  )([])
);

const isDirectory = dir => new Promise((resolve, reject) => {
  fs.stat(dir, (err, stat) => {
    if (err) reject(err);

    resolve(stat.isDirectory());
  });
});

const getSubDirectories = children => filterP(
  isDirectory,
  children,
);

const getChildrenFromDirectory = directory => new Promise((resolve, reject) => {
  fs.readdir(directory, (err, children) => {
    if (err) reject(err);
    if (!children.length) reject();

    resolve(children);
  });
});

// TODO:
//  - handle rejection
//  - add included file path
//  - integrate with main branch

const getFilesRecursive = rootDir => new Promise(async (resolve, reject) => {
  const getAbsPath = relPath => path.join(rootDir, relPath);

  const childrenRelative = await getChildrenFromDirectory(rootDir);
  const children = childrenRelative.map(child => getAbsPath(child));
  const subDirectories = await getSubDirectories(children);
  const files = R.uniq(children, subDirectories); // Not the right ramda function

  const filesFromSubDirectories = await Promise.all(
    R.map(getFilesRecursive, subDirectories),
  );

  resolve(
    R.flatten(
      files.concat(filesFromSubDirectories),
    ),
  );
});

const removeFileOrDirectory = inputPath => new Promise((resolve, reject) => {
  const rejectIfErr = (err) => {
    if (err) reject(err);
  };
  const removeFile = filePath => fs.unlink(filePath, rejectIfErr);
  const removeDir = dirPath => rimraf(dirPath, rejectIfErr);

  fs.unlink(inputPath, async (err) => {
    rejectIfErr(err);

    R.ifElse(
      await isDirectory,
      removeDir,
      removeFile,
    )(inputPath);

    resolve();
  });
});

module.exports = {
  getFilesRecursive,
  removeFileOrDirectory,
};
