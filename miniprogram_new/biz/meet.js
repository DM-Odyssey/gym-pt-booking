/**
 * 课程预约业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../utils/cloud.js');

// 课程分类
const MEET_CATE = [
  { id: 1, title: '私教预约', style: 'leftbig1' },
  { id: 2, title: '项目预约', style: 'leftbig1' },
  { id: 3, title: '团课预约', style: 'leftbig1' },
];

// 课程表单字段定义
const MEET_FIELDS = [];

// ===== API 封装（用户端） =====

/** 获取课程列表 */
const getMeetList = (params) => cloud.callCloudData('meet/list', params);

/** 获取课程详情 */
const getMeetDetail = (id) => cloud.callCloudData('meet/view', { id });

/** 获取某天有排期的日期列表 */
const getHasDaysFromDay = (params) => cloud.callCloudData('meet/list_has_day', params);

/** 获取某天的排期列表 */
const getMeetListByDay = (params) => cloud.callCloudData('meet/list_by_day', params);

/** 预约前校验 */
const beforeJoin = (params) => cloud.callCloudSubmit('meet/before_join', params);

/** 提交预约 */
const join = (params) => cloud.callCloudSubmit('meet/join', params);

/** 获取我的预约列表 */
const getMyJoinList = (params) => cloud.callCloudData('meet/my_join_list', params);

/** 取消预约 */
const cancelMyJoin = (id) => cloud.callCloudSubmit('meet/my_join_cancel', { id });

/** 获取预约详情 */
const getMyJoinDetail = (id) => cloud.callCloudData('meet/my_join_detail', { id });

module.exports = {
  MEET_CATE,
  MEET_FIELDS,
  getMeetList,
  getMeetDetail,
  getHasDaysFromDay,
  getMeetListByDay,
  beforeJoin,
  join,
  getMyJoinList,
  cancelMyJoin,
  getMyJoinDetail,
};
