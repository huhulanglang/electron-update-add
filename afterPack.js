const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const package = require('./package.json');
const AdmZip = require('adm-zip');
function calculateMD5(filePath) {
  return new Promise((resolve, reject) => {
    const md5 = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => md5.update(chunk));
    stream.on('end', () => {
      const hex = md5.digest('hex');
      resolve(hex);
    });
    stream.on('error', (err) => {
      console.log(err);
      reject(err);
    });
  })
}
exports.default = async function(context) {
  let targetPath
  if(context.packager.platform.nodeName === 'darwin') {
    targetPath = path.join(context.appOutDir, `${context.packager.appInfo.productName}.app/Contents/Resources`);
  } else {
    targetPath = path.join(context.appOutDir, './resources');
  }
  const appPath = path.join(targetPath, './app.asar.unpacked');//打包文件路径
  var zip = new AdmZip();
  zip.addLocalFolder(appPath);
  const unpacked = path.join(context.outDir, 'unpacked.zip');
  zip.writeZip(unpacked);
  const md5Value = await calculateMD5(unpacked);
  const jsonData = {
    version:package.version,
    percentage:1,
    updatePath:"",
    md5:md5Value,
    isSilent:false
  };
  var jsonContent = JSON.stringify(jsonData); 
  fs.writeFile(path.join(context.outDir, "pcVersion.json"), jsonContent, 'utf8', function (err) { 
    if (err) { 
      console.log(err); 
    }
 });
}
