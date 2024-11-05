const { join } = require("path");
const fs = require("fs");

module.exports = function unlinkFile(path, pathextra) {
  const directoryPath = join(process.cwd(), `/uploads/${pathextra}`);
  try {
    fs.unlinkSync(join(directoryPath, path));
  } catch (e) {
    console.log(e);
  }

  return "";
};
