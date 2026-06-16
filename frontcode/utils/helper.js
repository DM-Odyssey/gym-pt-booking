/**
 * 通用工具函数
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

/** 判断变量是否已定义（不为 undefined） */
const isDefined = (val) => val !== undefined;

/** 判断是否为 null 或 undefined 或空字符串 */
const isNull = (val) => val === null || val === undefined || val === '';

/** 判断对象是否为空 */
const isObjectNull = (obj) => Object.keys(obj).length === 0;

/** 异步延迟 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 数字补零 */
const formatNumber = (n) => {
  const s = n.toString();
  return s[1] ? s : '0' + s;
};

/** 从 picker options 数组中获取指定值的索引 */
const getOptionsIdx = (options, val) => {
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === val) return i;
  }
  return 0;
};

/** JSON 深拷贝 */
const deepClone = (data) => JSON.parse(JSON.stringify(data));

module.exports = {
  isDefined,
  isNull,
  isObjectNull,
  sleep,
  formatNumber,
  getOptionsIdx,
  deepClone,
};
