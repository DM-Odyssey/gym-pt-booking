/**
 * 数据处理工具
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const helper = require('./helper.js');
const deepClone = helper.deepClone;

/** 生成 [min, max] 范围内的随机整数 */
const genRandomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** 生成指定长度的随机字符串（字母+数字） */
const genRandomString = (len = 32) => {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  let result = '';
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

/** 生成指定长度的随机字母串 */
const genRandomAlpha = (len = 32) => {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz';
  let result = '';
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

/** 将逗号分隔的标签字符串格式化为数组 */
const fmtTag = (tag) => {
  if (!tag) return [];
  return tag.split(',').map((t) => t.trim()).filter(Boolean);
};

/** 将一维数组按 size 切分为二维数组 */
const spArr = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
};

/** 字符串转数组，支持自定义分隔符 */
const str2Arr = (str, sp = ',') => {
  if (!str) return [];
  return str.split(sp).map((s) => s.trim()).filter(Boolean);
};

/** 判断字符串是否为数字 */
const isNumber = (val) => /^\d+(\.\d+)?$/.test(val);

/** 从对象数组中提取指定 key 的值组成新数组 */
const getArrByKey = (arr, key) => {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) => item[key]).filter((v) => helper.isDefined(v));
};

/** 从对象数组中提取多个 key 的值 */
const getArrByKeyMulti = (arr, keys) => {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) => {
    const obj = {};
    keys.forEach((k) => { obj[k] = item[k]; });
    return obj;
  });
};

/** 按 key=val 从数组中查找对象 */
const getDataByKey = (arr, key, val) => {
  if (!arr || !Array.isArray(arr)) return null;
  return arr.find((item) => item[key] === val) || null;
};

/** 截断文本，去除换行并限制长度 */
const fmtText = (content, len = 100) => {
  if (!content) return '';
  const text = content.replace(/\n/g, '').trim();
  return text.length > len ? text.substring(0, len) + '...' : text;
};

/** 下划线转驼峰 */
const toHump = (name) => name.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());

/** 驼峰转下划线 */
const toLine = (name) => name.replace(/([A-Z])/g, '_$1').toLowerCase();

/** 金额格式化 */
const fmtMoney = (s, dot = 2, prefix = '') => {
  const num = parseFloat(s);
  if (isNaN(num)) return prefix + '0.00';
  return prefix + num.toFixed(dot);
};

/** 简单数组转对象数组 [{label, value}] */
const arr2ObjectArr = (arr, key1 = 'label', key2 = 'value', key3 = '') => {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) => {
    const obj = { [key1]: item, [key2]: item };
    if (key3) obj[key3] = item;
    return obj;
  });
};

/** 对象数组升序排序比较器 */
const objArrSortAsc = (property) => (a, b) => {
  const v1 = a[property];
  const v2 = b[property];
  return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
};

/** 对象数组降序排序比较器 */
const objArrSortDesc = (property) => (a, b) => {
  const v1 = a[property];
  const v2 = b[property];
  return v1 > v2 ? -1 : v1 < v2 ? 1 : 0;
};

/** 数组元素增删切换（用于标签多选等场景） */
const arrAddDel = (arr, data, sort = false) => {
  if (!arr) arr = [];
  const idx = arr.indexOf(data);
  if (idx > -1) {
    arr.splice(idx, 1);
  } else {
    arr.push(data);
    if (sort) arr.sort();
  }
  return arr;
};

/** 左补齐 */
const padLeft = (str, len, charStr = '0') => {
  str = str.toString();
  return str.length >= len ? str : charStr.repeat(len - str.length) + str;
};

/** 右补齐 */
const padRight = (str, len, charStr = '0') => {
  str = str.toString();
  return str.length >= len ? str : str + charStr.repeat(len - str.length);
};

/** 解析表单选项字符串 → [{label, value}]
 *  支持两种格式: '0:未开始|1:进行中' 或 '0=未开始,1=进行中' */
const getSelectOptions = (str) => {
  if (!str) return [];
  if (str.includes('=')) {
    return str.split(',').map((item) => {
      const parts = item.split('=');
      const val = parts[0];
      const label = (parts[1] || '').split('|')[0];
      return { val, label };
    });
  }
  return str.split('|').map((item) => {
    const [value, label] = item.split(':');
    return { val: value, label };
  });
};

/** 数组元素交换位置 */
const arraySwap = (arr, index1, index2) => {
  arr[index1] = arr.splice(index2, 1, arr[index1])[0];
  return arr;
};

module.exports = {
  deepClone,
  genRandomNum,
  genRandomString,
  genRandomAlpha,
  fmtTag,
  spArr,
  str2Arr,
  isNumber,
  getArrByKey,
  getArrByKeyMulti,
  getDataByKey,
  fmtText,
  toHump,
  toLine,
  fmtMoney,
  arr2ObjectArr,
  objArrSortAsc,
  objArrSortDesc,
  arrAddDel,
  padLeft,
  padRight,
  arraySwap,
  getSelectOptions,
};
