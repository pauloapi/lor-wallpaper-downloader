const { createHash } = require('crypto');
const fs = require('fs')

module.exports.getFileHash = function (filename) {
  const fileBuffer = fs.readFileSync(filename);
  return createHash('sha256').update(fileBuffer).digest('hex');
}