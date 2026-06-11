/**
 * 页面初始化工具
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const setting = require('../config/setting.js');
const cache = require('./cache.js');
const { isDefined } = require('./helper.js');

/** 从页面参数中提取 id */
const initPageOptions = (that, options, idName = 'id') => {
  let id = options[idName];
  if (!id) id = options['scene']; // 二维码扫码进入
  if (!id) return false;
  that.setData({ [idName]: id });
  return true;
};

/** 安全 setData，过滤内部属性 */
const setPageData = (that, data) => {
  if (isDefined(data['__webviewId__'])) delete data['__webviewId__'];
  that.setData(data);
};

/** 检查列表缓存是否存在 */
const isListCacheExist = (key) => {
  if (setting.CACHE_IS_LIST) {
    return !!cache.get(key.toUpperCase() + '_LIST');
  }
  return false;
};

/** 设置列表缓存 */
const setListCache = (key, time) => {
  if (setting.CACHE_IS_LIST) {
    cache.set(key.toUpperCase() + '_LIST', 'TRUE', time || setting.CACHE_LIST_TIME);
  }
};

/** 移除列表缓存 */
const removeListCache = (key) => {
  if (setting.CACHE_IS_LIST) {
    cache.remove(key.toUpperCase() + '_LIST');
  }
};

module.exports = {
  initPageOptions,
  setPageData,
  isListCacheExist,
  setListCache,
  removeListCache,
};
