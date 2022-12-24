const Downloader = require("nodejs-file-downloader");
const path = require('path');

module.exports.downloadFile = async function (url, destination) {

  const downloader = new Downloader({
    url,
    directory: destination,
    maxAttempts: 3,
    skipExistingFileName: true
  });

  let filename = path.join(destination, url.split('/')[url.split('/').length - 1])
  await downloader.download();
  return filename
}