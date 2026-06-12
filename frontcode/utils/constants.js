/**
 * 缓存键名与过期时间常量
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

module.exports = {
  // 缓存键名
  CACHE_TOKEN: 'CACHE_TOKEN',
  CACHE_ADMIN: 'ADMIN_TOKEN',
  CACHE_WORK: 'WORK_TOKEN',

  // 过期时间（秒）
  CACHE_TOKEN_EXPIRE: 86400,       // 用户登录：24小时
  ADMIN_TOKEN_EXPIRE: 7200,        // 管理员：2小时
  WORK_TOKEN_EXPIRE: 36000,        // 教练：10小时
};
