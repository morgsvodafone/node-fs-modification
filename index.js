const fs = require('fs');
const path = require('path');
const R = require('ramda');

const isDirectory = dir => new Promise((resolve, reject) => {
  fs.stat(dir, (err, stat) => {
    if (err) reject(err);

    resolve(stat.isDirectory());
  });
});

const getChildrenFromDirectory = parentDir => new Promise((resolve, reject) => {
  const getAbsPath = relPath => path.join(parentDir, relPath);

  fs.readdir(parentDir, async (err, children) => {
    if (err) reject(err);
    if (!children.length) resolve([]);

    const fileList = [];
    const dirList = [];

    const childIsDirectoryMap = await Promise.all(
      R.pipe(
        R.map(getAbsPath),
        R.map(isDirectory),
      )(children),
    );

    children.forEach((child, index) => {
      if (childIsDirectoryMap[index]) {
        dirList.push(child);
      } else {
        fileList.push(child);
      }
    });

    const filesFromChildDirectories = await Promise.all(
      R.pipe(
        R.map(getAbsPath),
        R.map(getChildrenFromDirectory),
      )(dirList),
    );

    resolve(R.flatten(fileList.concat(filesFromChildDirectories)));
  });
});

getChildrenFromDirectory('../myvf-reactnative/App').then(data => console.log(data));
