const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

const cloneRepo = async (repoUrl, appName) => {
  const clonePath = path.join(__dirname, '../../tmp', `${appName}-${Date.now()}`);

  // Ensure tmp directory exists
  fs.mkdirSync(clonePath, { recursive: true });

  const git = simpleGit();
  await git.clone(repoUrl, clonePath);

  return clonePath;
};

module.exports = { cloneRepo };