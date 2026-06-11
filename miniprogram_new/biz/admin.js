/**
 * 后台管理业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cache = require('../utils/cache.js');
const cloud = require('../utils/cloud.js');
const router = require('../utils/router.js');
const constants = require('../utils/constants.js');

/** 管理员登录 */
const adminLogin = async (that, name, pwd) => {
  if (name.length < 5 || name.length > 30) {
    wx.showToast({ title: '账号输入错误(5-30位)', icon: 'none' });
    return;
  }
  if (pwd.length < 5 || pwd.length > 30) {
    wx.showToast({ title: '密码输入错误(5-30位)', icon: 'none' });
    return;
  }
  try {
    const res = await cloud.callCloudSubmit('admin/login', { name, pwd }, { title: '登录中' });
    if (res?.data?.name) cache.set(constants.CACHE_ADMIN, res.data, constants.ADMIN_TOKEN_EXPIRE);
    wx.reLaunch({ url: '/pages/admin/home/admin_home' });
  } catch (e) {
    console.error(e);
  }
};

/** 清除管理员登录 */
const clearAdminToken = () => cache.remove(constants.CACHE_ADMIN);

/** 获取管理员信息 */
const getAdminToken = () => cache.get(constants.CACHE_ADMIN);

/** 获取管理员名 */
const getAdminName = () => {
  const admin = cache.get(constants.CACHE_ADMIN);
  return admin?.name || '';
};

/** 是否超级管理员 */
const isSuperAdmin = () => {
  const admin = cache.get(constants.CACHE_ADMIN);
  return admin?.type === 1;
};

/** 管理员登录状态检查 */
const isAdmin = (that, isSuper = false) => {
  wx.setNavigationBarColor({ backgroundColor: '#2499f2', frontColor: '#ffffff' });

  const admin = cache.get(constants.CACHE_ADMIN);
  if (!admin) {
    wx.showModal({
      title: '', content: '登录已过期，请重新登录', showCancel: false,
      success: () => wx.reLaunch({ url: '/pages/admin/login/admin_login' }),
    });
    return false;
  }
  if (isSuper && admin.type !== 1) {
    wx.showModal({
      title: '', content: '此功能需要超级管理员操作', showCancel: false,
      success: () => wx.reLaunch({ url: '/pages/admin/home/admin_home' }),
    });
    return false;
  }
  that.setData({ isAdmin: true, isSuperAdmin: isSuperAdmin() });
  return true;
};

/** 内容字数统计 */
const setContentDesc = (that) => {
  const content = that.data.formContent || [];
  let imgCnt = 0, textCnt = 0;
  for (let k = 0; k < content.length; k++) {
    if (content[k].type === 'img') imgCnt++;
    if (content[k].type === 'text') textCnt++;
  }
  that.setData({ contentDesc: (imgCnt || textCnt) ? `${textCnt}段文字，${imgCnt}张图片` : '未填写' });
};

// 表单校验规则
const CHECK_FORM_MGR_ADD = {
  name: 'formName|must|string|min:5|max:30|name=账号',
  desc: 'formDesc|must|string|max:30|name=姓名',
  phone: 'formPhone|string|len:11|name=手机',
  password: 'formPassword|must|string|min:6|max:30|name=密码',
};

const CHECK_FORM_MGR_EDIT = {
  name: 'formName|must|string|min:5|max:30|name=账号',
  desc: 'formDesc|must|string|max:30|name=姓名',
  phone: 'formPhone|string|len:11|name=手机',
  password: 'formPassword|string|min:6|max:30|name=新密码',
};

const CHECK_FORM_MGR_PWD = {
  oldPassword: 'formOldPassword|must|string|min:6|max:30|name=旧密码',
  password: 'formPassword|must|string|min:6|max:30|name=新密码',
  password2: 'formPassword2|must|string|min:6|max:30|name=新密码再次填写',
};

module.exports = {
  adminLogin, clearAdminToken, getAdminToken, getAdminName,
  isSuperAdmin, isAdmin, setContentDesc,
  CHECK_FORM_MGR_ADD, CHECK_FORM_MGR_EDIT, CHECK_FORM_MGR_PWD,
};
