// Bridge: 重新导出 utils/{router,toast,dom,form,list,pic,page_init}.js
const toast = require('../utils/toast.js');
const router = require('../utils/router.js');
const dom = require('../utils/dom.js');
const form = require('../utils/form.js');
const list = require('../utils/list.js');
const pic = require('../utils/pic.js');
const page_init = require('../utils/page_init.js');

module.exports = {
  ...toast,
  ...router,
  ...dom,
  ...form,
  ...list,
  ...pic,
  ...page_init,
};
