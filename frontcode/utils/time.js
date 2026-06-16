/**
 * 时间日期工具
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const { isDefined, formatNumber } = require('./helper.js');

/** 去掉日期中月日的多余前缀0 */
const simpleDate = (date) => {
  const arr = date.split('-');
  if (arr.length < 3) return date;
  let month = arr[1];
  if (month.startsWith('0')) month = month.replace('0', '');
  let day = arr[2];
  if (day.startsWith('0')) day = day.replace('0', '');
  return `${arr[0]}-${month}-${day}`;
};

/** 中文日期格式化 Y-M-D → 2026年6月11日 */
const fmtDateCHN = (date, fmt = 'Y-M-D') => {
  if (!date) return '';
  if (fmt === 'hh:mm' && date.includes(':')) {
    const time = date.includes(' ') ? date.split(' ')[1] : date;
    const [h, m] = time.split(':');
    return `${Number(h)}点${m}分`;
  }
  if (fmt === 'Y-M-D hh:mm') {
    const parts = date.split(' ');
    if (parts.length !== 2) return date;
    return fmtDateCHN(parts[0], 'Y-M-D') + fmtDateCHN(parts[1], 'hh:mm');
  }
  if (fmt === 'M-D hh:mm') {
    const parts = date.split(' ');
    if (parts.length !== 2) return date;
    return fmtDateCHN(parts[0], 'M-D') + ' ' + fmtDateCHN(parts[1], 'hh:mm');
  }
  const d = date.includes(' ') ? date.split(' ')[0] : date;
  const arr = d.split('-');
  if (fmt === 'Y-M') return `${arr[0]}年${Number(arr[1])}月`;
  if (fmt === 'M-D') return `${arr[1]}月${Number(arr[2])}日`;
  if (fmt === 'Y') return `${arr[0]}年`;
  return `${arr[0]}年${Number(arr[1])}月${Number(arr[2])}日`;
};

/** 时间戳转格式化时间 */
const timestamp2Time = (unixtime, format = 'Y-M-D h:m:s', diff = 0) => {
  const fmtMap = ['Y', 'M', 'D', 'h', 'm', 's'];
  const d = new Date(unixtime + diff);
  const vals = [
    d.getFullYear(),
    formatNumber(d.getMonth() + 1),
    formatNumber(d.getDate()),
    formatNumber(d.getHours()),
    formatNumber(d.getMinutes()),
    formatNumber(d.getSeconds()),
  ];
  let result = format;
  fmtMap.forEach((f, i) => { result = result.replace(f, vals[i]); });
  return result;
};

/** 相对时间描述（x分钟前、x小时前…） */
const timestame2Ago = (timestamp, fmt = 'Y-M-D') => {
  const minute = 60000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 0) return '';
  if (diff < minute) return '刚刚';
  if (diff < hour) return ` ${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return ` ${Math.floor(diff / hour)}小时前`;
  if (diff < week) return ` ${Math.floor(diff / day)}天前`;
  if (diff < month) return ` ${Math.floor(diff / week)}周前`;
  if (diff < month * 3) return ` ${Math.floor(diff / month)}月前`;
  return timestamp2Time(timestamp, fmt);
};

/** 日期字符串转时间戳（支持 Y-M-D 和 Y-M-D h:m:s） */
const time2Timestamp = (date) => {
  let d = date;
  if (d.length < 10) {
    const arr = d.split('-');
    if (arr[1].length === 1) arr[1] = '0' + arr[1];
    if (arr[2].length === 1) arr[2] = '0' + arr[2];
    d = arr.join('-');
  }
  if (d.length === 10) d += ' 00:00:00';
  return new Date(d.replace(/-/g, '/')).getTime();
};

/** 获取当前时间戳或格式化时间 */
const time = (fmt, step = 0) => {
  const t = Date.now() + step * 1000;
  if (isDefined(fmt)) return timestamp2Time(t, fmt);
  return t;
};

/** 获取某天的 0 点时间戳 */
const getDayFirstTimestamp = (timestamp) => {
  const ts = timestamp || time();
  return time2Timestamp(timestamp2Time(ts, 'Y-M-D'));
};

/** 获取某天所在月的第一天时间戳 */
const getMonthFirstTimestamp = (ts) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

/** 获取某天所在月的最后一天时间戳 */
const getMonthLastTimestamp = (ts) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1;
};

/** 获取当前分钟边界时间戳 */
const getNowMinTimestamp = () => {
  const min = time('Y-M-D h:m') + ':00';
  return { min, timestamp: time2Timestamp(min) };
};

/** 根据出生日期计算年龄 */
const getAge = (birth, isMonth = false) => {
  const arr = birth.split('-');
  const birthYear = parseInt(arr[0]);
  const birthMonth = parseInt(arr[1]);
  const birthDay = parseInt(arr[2]);
  const d = new Date();
  const nowYear = d.getFullYear();
  const nowMonth = d.getMonth() + 1;
  const nowDay = d.getDate();
  if (nowYear === birthYear) {
    const monthDiff = nowMonth - birthMonth;
    if (isMonth && monthDiff >= 0) return monthDiff + '个月';
    return '';
  }
  const ageDiff = nowYear - birthYear;
  if (ageDiff <= 0) return '-1';
  let returnAge = ageDiff + '岁';
  let mouthAge = '';
  if (nowMonth === birthMonth) {
    if (nowDay < birthDay) returnAge = (ageDiff - 1) + '岁';
  } else {
    const monthDiff = nowMonth - birthMonth;
    if (monthDiff < 0) returnAge = (ageDiff - 1) + '岁';
    else mouthAge = monthDiff + '个月';
  }
  return isMonth ? returnAge + mouthAge : returnAge;
};

/** 日期转中文星期 */
const week = (day) => {
  const arr = day.split('-');
  const d = new Date(parseInt(arr[0]), parseInt(arr[1]) - 1, parseInt(arr[2]));
  const map = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + map[d.getDay()];
};

/** 获取日期所在周的周一 */
const getFirstOfWeek = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay() || 7;
  const mondayTime = d.getTime() - (dayOfWeek - 1) * 86400000;
  return timestamp2Time(mondayTime, 'Y-M-D');
};

/** 获取日期所在周的周日 */
const getLastOfWeek = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay() || 7;
  const sundayTime = d.getTime() + (7 - dayOfWeek) * 86400000;
  return timestamp2Time(sundayTime, 'Y-M-D');
};

/** 获取日期所在月的第一天 */
const getFirstOfMonth = (date) => {
  const arr = date.split('-');
  return `${arr[0]}-${arr[1]}-01`;
};

/** 获取日期所在月的最后一天 */
const getLastOfMonth = (date) => {
  const d = new Date(date);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
  return timestamp2Time(lastDay, 'Y-M-D');
};

/** 倒计时计算（天时秒分） */
const getTimeLeft = (datetimeTo, flag = 1) => {
  let target = datetimeTo;
  if (String(target).includes('-')) {
    if (!String(target).includes(':')) target += ' 00:00:00';
    target = new Date(target).getTime();
  }
  const mss = target - Date.now();
  const days = Math.floor(mss / 86400000);
  const hours = Math.floor((mss % 86400000) / 3600000);
  const minutes = Math.floor((mss % 3600000) / 60000);
  const seconds = Math.floor((mss % 60000) / 1000);
  return [flag * days, flag * hours, flag * minutes, flag * seconds];
};

module.exports = {
  fmtDateCHN,
  simpleDate,
  getTimeLeft,
  getNowMinTimestamp,
  getMonthFirstTimestamp,
  getMonthLastTimestamp,
  getDayFirstTimestamp,
  timestamp2Time,
  timestame2Ago,
  time2Timestamp,
  time,
  getAge,
  week,
  getFirstOfWeek,
  getLastOfWeek,
  getFirstOfMonth,
  getLastOfMonth,
};
