/**
 * 后台课程管理业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const meet = require('./meet.js');
const data = require('../utils/data.js');
const timeHelper = require('../utils/time.js');

// Constants (from old project_setting.js)
const MEET_FIELDS = [];
const MEET_JOIN_FIELDS = [];
const MEET_NEW_NODE = { start: '09:00', end: '10:00', stat: { succCnt: 0, day: '' }, isLimit: false, limit: 0, status: 1 };

const getCateName = function(cateId) {
  for (var k = 0; k < meet.MEET_CATE.length; k++) {
    if (meet.MEET_CATE[k].id == cateId) return meet.MEET_CATE[k].title;
  }
  return '';
};

const getLeaveDay = function(days) {
  var now = timeHelper.time('Y-M-D'), count = 0;
  for (var k = 0; k < days.length; k++) { if (days[k].day >= now) count++; }
  return count;
};

const genRandomAlpha = function(len) {
  var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz', result = '';
  for (var i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

const getNewTimeNode = function(day, timeTemp) {
  var node = data.deepClone(timeTemp || MEET_NEW_NODE);
  day = day.replace(/-/g, '');
  node.mark = 'T' + day + 'AAA' + genRandomAlpha(10).toUpperCase();
  return node;
};

const initFormData = function() {
  var cateIdOptions = meet.MEET_CATE.map(function(item) {
    return { label: item.title, type: 'cateId', val: item.id, value: item.id };
  });
  return {
    cateIdOptions: cateIdOptions,
    fields: MEET_FIELDS,
    formTitle: '',
    formCateId: (cateIdOptions.length === 1) ? cateIdOptions[0].val : '',
    formOrder: 9999,
    formCancelSet: 1,
    formForms: [],
    formDaysSet: [],
    formPhone: '',
    formPassword: '',
    formJoinForms: []
  };
};

const getDaysTimeOptions = function() {
  var hours = [], mins = [];
  for (var k = 0; k <= 23; k++) hours.push({ label: k + '点', val: (k < 10 ? '0' : '') + k });
  for (var k = 0; k < 60; k += 5) mins.push({ label: k + '分', val: (k < 10 ? '0' : '') + k });
  return [hours, mins];
};

const CHECK_FORM = {
  title: 'formTitle|must|string|min:2|max:50|name=标题',
  cateId: 'formCateId|must|id|name=分类',
  order: 'formOrder|must|int|min:0|max:9999|name=排序号',
  cancelSet: 'formCancelSet|must|int|name=取消设置',
  phone: 'formPhone|string|len:11|name=教练登陆手机',
  password: 'formPassword|string|min:6|max:30|name=教练登陆密码',
};

module.exports = {
  getCateName, getLeaveDay, getNewTimeNode, initFormData, getDaysTimeOptions, CHECK_FORM,
};
