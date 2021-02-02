const fs = require('fs');

const saveFile = (filename, data) => {
  const jsonData = JSON.stringify(data);
  fs.writeFileSync(`./imported_matches/${filename}.json`, jsonData);
};
module.exports = {
  saveFile,
};
