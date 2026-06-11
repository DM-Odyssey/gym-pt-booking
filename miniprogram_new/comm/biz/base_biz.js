// Bridge: 重新导出 biz/common.js 的分类处理函数
const common = require('../../biz/common.js');
module.exports = {
  getCateName: common.getCateName,
  getCateList: common.getCateList,
  setCateTitle: common.setCateTitle,
  getRichEditorDesc: common.getRichEditorDesc,
};
