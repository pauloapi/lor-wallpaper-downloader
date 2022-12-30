const { createHash } = require('crypto');
const fs = require('fs')
const Downloader = require("nodejs-file-downloader");
const path = require('path');

module.exports.getFileHash = function (filename) {
  const fileBuffer = fs.readFileSync(filename);
  return createHash('sha256').update(fileBuffer).digest('hex');
}

module.exports.downloadFile = async function (url, destination) {
  const downloader = new Downloader({
    url,
    directory: destination,
    maxAttempts: 3,
    skipExistingFileName: true
  });

  const { filePath, downloadStatus } = await downloader.download();
  if (filePath) {
    return filePath;
  } else {
    let filename = path.join(destination, url.split('/')[url.split('/').length - 1])
    return filename
  }
}