/**
 * utils 桶文件 — 汇聚所有工具模块（替代旧 page_helper 单体）
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const helper = require('./helper.js');
const cloud = require('./cloud.js');
const cache = require('./cache.js');
const toast = require('./toast.js');
const router = require('./router.js');
const dom = require('./dom.js');
const form = require('./form.js');
const list = require('./list.js');
const pic = require('./pic.js');
const pageInit = require('./page_init.js');
const validate = require('./validate.js');
const time = require('./time.js');
const data = require('./data.js');

module.exports = {
  ...helper,
  ...cloud,
  ...cache,
  ...toast,
  ...router,
  ...dom,
  ...form,
  ...list,
  ...pic,
  ...pageInit,
  ...validate,
  ...time,
  ...data,
};
