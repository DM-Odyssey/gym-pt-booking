/**
 * 小程序前端配置
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

module.exports = {
  // 云环境
  CLOUD_ID: 'your-cloud-env-id',

  // 运行模式
  IS_DEMO: false,

  // 图片上传
  IMG_UPLOAD_SIZE: 20,  // 图片上传大小上限（MB）

  // 列表缓存
  CACHE_IS_LIST: true,
  CACHE_LIST_TIME: 1800, // 秒

  // 微信手机号快速获取（需小程序通过认证，否则关闭）
  MOBILE_CHECK: false,

  // 项目标识（单项目模式下为空字符串，保留兼容性）
  PID: '',

  // 版本
  VER: 'build 2026.06.11',
};
