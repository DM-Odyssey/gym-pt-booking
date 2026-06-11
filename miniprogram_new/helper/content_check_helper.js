// Bridge: 重新导出 utils/pic.js 中的图片检测相关函数
const pic = require('../utils/pic.js');
module.exports = {
  imgTypeCheck: pic.imgTypeCheck,
  imgSizeCheck: pic.imgSizeCheck,
};
