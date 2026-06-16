/**
 * 带过期时间的本地缓存
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const DEADTIME_SUFFIX = '_deadtime';

/** 设置缓存，ttl 为秒 */
const set = (key, value, ttl) => {
  const deadtime = ttl ? Date.now() + ttl * 1000 : 0;
  wx.setStorageSync(key, value);
  if (ttl) wx.setStorageSync(key + DEADTIME_SUFFIX, deadtime);
};

/** 获取缓存，过期返回 defaultValue */
const get = (key, defaultValue = null) => {
  const deadtime = wx.getStorageSync(key + DEADTIME_SUFFIX);
  if (deadtime && Date.now() > deadtime) {
    remove(key);
    return defaultValue;
  }
  const val = wx.getStorageSync(key);
  return val !== '' && val !== undefined ? val : defaultValue;
};

/** 删除缓存 */
const remove = (key) => {
  wx.removeStorageSync(key);
  wx.removeStorageSync(key + DEADTIME_SUFFIX);
};

/** 清除全部缓存 */
const clear = () => wx.clearStorageSync();

module.exports = { set, get, remove, clear };
