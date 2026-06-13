/**
 * 教练端业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cache = require('../utils/cache.js');
const cloud = require('../utils/cloud.js');
const router = require('../utils/router.js');
const constants = require('../utils/constants.js');

/** 教练登录 */
const workLogin = async (that, phone, pwd) => {
  if (phone.length !== 11) {
    wx.showToast({ title: '手机号输入错误', icon: 'none' });
    return;
  }
  if (pwd.length < 5 || pwd.length > 30) {
    wx.showToast({ title: '密码输入错误(5-30位)', icon: 'none' });
    return;
  }
  try {
    const res = await cloud.callCloudSubmit('work/login', { phone, pwd }, { title: '登录中' });
    if (res?.data?.name) cache.set(constants.CACHE_WORK, res.data, constants.WORK_TOKEN_EXPIRE);
    wx.reLaunch({ url: '/pages/work/home/work_home' });
  } catch (e) {
    if (e && e.msg) wx.showToast({ title: e.msg, icon: 'none' });
    else wx.showToast({ title: '账号或密码错误', icon: 'none' });
  }
};

/** 清除教练登录 */
const clearWorkToken = () => cache.remove(constants.CACHE_WORK);

/** 获取教练信息 */
const getWorkToken = () => cache.get(constants.CACHE_WORK);

/** 获取教练名 */
const getWorkName = () => {
  const work = cache.get(constants.CACHE_WORK);
  return work?.name || '';
};

/** 获取教练 ID */
const getWorkId = () => {
  const token = cache.get(constants.CACHE_WORK);
  return token?.id || '';
};

/** 教练登录状态检查 */
const isWork = (that) => {
  wx.setNavigationBarColor({ backgroundColor: '#4ADE80', frontColor: '#ffffff' });

  const work = cache.get(constants.CACHE_WORK);
  if (!work) {
    wx.showModal({
      title: '', content: '登录已过期，请重新登录', showCancel: false,
      success: () => wx.reLaunch({ url: '/pages/work/login/work_login' }),
    });
    return false;
  }
  that.setData({ isWork: true });
  return true;
};

const CHECK_FORM_MGR_PWD = {
  oldPassword: 'formOldPassword|must|string|min:6|max:30|name=旧密码',
  password: 'formPassword|must|string|min:6|max:30|name=新密码',
  password2: 'formPassword2|must|string|min:6|max:30|name=新密码再次填写',
};

module.exports = {
  workLogin, clearWorkToken, getWorkToken, getWorkName,
  getWorkId, isWork, CHECK_FORM_MGR_PWD,
};
