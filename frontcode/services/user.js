/**
 * 用户业务模块
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const cloud = require('../utils/cloud.js');

// ===== API 封装 =====

/** 获取我的详情 */
const getMyDetail = () => cloud.callCloudData('passport/my_detail', {});

/** 注册 */
const register = (params) => cloud.callCloudSubmit('passport/register', params);

/** 编辑基本信息 */
const editBase = (params) => cloud.callCloudSubmit('passport/edit_base', params);

module.exports = {
  getMyDetail,
  register,
  editBase,
};
