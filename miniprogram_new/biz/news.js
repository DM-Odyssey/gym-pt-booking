/**
 * 公告资讯业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../utils/cloud.js');

// 资讯分类
const NEWS_CATE = [];

// ===== API 封装 =====

/** 获取公告列表 */
const getNewsList = (params) => cloud.callCloudData('news/list', params);

/** 获取公告详情 */
const getNewsDetail = (id) => cloud.callCloudData('news/view', { id });

module.exports = {
  NEWS_CATE,
  getNewsList,
  getNewsDetail,
};
