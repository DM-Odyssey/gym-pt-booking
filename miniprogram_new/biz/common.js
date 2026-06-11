/**
 * 通用业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const { fmtText } = require('../utils/data.js');
const cache = require('../utils/cache.js');
const setting = require('../config/setting.js');
const timeHelper = require('../utils/time.js');
const router = require('../utils/router.js');

const CACHE_FOOT = 'CACHE_FOOT';

/** 根据分类 ID 获取分类名称 */
const getCateName = (cateId, cateList) => {
  for (let k = 0; k < cateList.length; k++) {
    if (cateList[k].id == cateId) return cateList[k].title;
  }
  return '';
};

/** 将分类列表转为 picker 选项格式 */
const getCateList = (cateList) =>
  cateList.map((item) => ({
    label: item.title,
    type: 'cateId',
    val: item.id,
    value: item.id,
  }));

/** 根据分类 ID 设置导航栏标题 */
const setCateTitle = (cateList, cateId = null) => {
  const pages = getCurrentPages();
  const curPage = pages[pages.length - 1];
  if (!curPage) return;

  if (!cateId && curPage.options?.id) cateId = curPage.options.id;

  for (let k = 0; k < cateList.length; k++) {
    if (cateList[k].id == cateId) {
      wx.setNavigationBarTitle({ title: cateList[k].title });
      curPage.setData({ listMode: cateList[k].style || '' });
      return;
    }
  }
};

/** 从富文本内容中提取简介 */
const getRichEditorDesc = (desc, content) => {
  if (desc) return fmtText(desc, 100);
  if (!Array.isArray(content)) return desc;
  for (let k = 0; k < content.length; k++) {
    if (content[k].type === 'text') return fmtText(content[k].val, 100);
  }
  return desc;
};

/** 列表缓存是否存在 */
const isCacheList = (key) => {
  if (!setting.CACHE_IS_LIST) return false;
  return cache.get(key.toUpperCase() + '_LIST');
};

/** 移除列表缓存 */
const removeCacheList = (key) => {
  if (setting.CACHE_IS_LIST) cache.remove(key.toUpperCase() + '_LIST');
};

/** 设置列表缓存 */
const setCacheList = (key, time = setting.CACHE_LIST_TIME) => {
  if (setting.CACHE_IS_LIST) cache.set(key.toUpperCase() + '_LIST', 'TRUE', time);
};

/** 获取浏览历史 */
const getFootList = () => {
  let foot = cache.get(CACHE_FOOT);
  if (foot) {
    for (let i = 0; i < foot.length; i++) {
      foot[i].time = timeHelper.timestamp2Time(foot[i].time);
    }
  }
  return foot;
};

/** 添加浏览足迹 */
const addFoot = (type, title, size = 60, expire = 86400 * 365 * 3) => {
  const path = router.getCurrentPageUrlWithArgs();
  if (!path || !title || !type) return [];

  let foot = cache.get(CACHE_FOOT, []);

  // 去重
  for (let k = 0; k < foot.length; k++) {
    if (path === foot[k].path) foot.splice(k, 1);
  }

  foot.unshift({ path, type, title, time: timeHelper.time() });
  if (foot.length > size) foot.splice(foot.length - 1, 1);

  cache.set(CACHE_FOOT, foot, expire);
  return foot;
};

module.exports = {
  getCateName,
  getCateList,
  setCateTitle,
  getRichEditorDesc,
  isCacheList,
  removeCacheList,
  setCacheList,
  getFootList,
  addFoot,
};
