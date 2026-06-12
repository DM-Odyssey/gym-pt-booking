/**
 * 登录认证业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cache = require('../utils/cache.js');
const cloud = require('../utils/cloud.js');
const constants = require('../utils/constants.js');
const { isDefined } = require('../utils/helper.js');
const router = require('../utils/router.js');

/** 获取当前用户 token */
const getToken = () => cache.get(constants.CACHE_TOKEN) || null;

/** 保存用户 token */
const setToken = (token) => {
  if (!token) return;
  cache.set(constants.CACHE_TOKEN, token, constants.CACHE_TOKEN_EXPIRE);
};

/** 清除用户 token */
const clearToken = () => cache.remove(constants.CACHE_TOKEN);

/** 获取用户 ID */
const getUserId = () => {
  const token = cache.get(constants.CACHE_TOKEN);
  return token?.id || '';
};

/** 获取用户名 */
const getUserName = () => {
  const token = cache.get(constants.CACHE_TOKEN);
  return token?.name || '';
};

/** 获取用户状态 */
const getStatus = () => {
  const token = cache.get(constants.CACHE_TOKEN);
  return token?.status ?? -1;
};

/** 是否已登录 */
const isLogin = () => getUserId().length > 0;

/** 处理非活跃账号状态 */
const loginStatusHandler = (method, status) => {
  let content = '';
  if (status === 0) content = '您的注册正在审核中，暂时无法使用此功能！';
  else if (status === 8) content = '您的注册审核未通过，暂时无法使用此功能；请在个人中心修改资料，再次提交审核！';
  else if (status === 9) content = '您的账号已经禁用, 无法使用此功能！';

  if (method === 'cancel') {
    wx.showModal({ title: '温馨提示', content, confirmText: '取消', showCancel: false });
  } else if (method === 'back') {
    wx.showModal({
      title: '温馨提示', content, confirmText: '返回', showCancel: false,
      success: () => wx.navigateBack(),
    });
  }
  return false;
};

/**
 * 登录检测与处理
 * @param {boolean} mustLogin - 是否必须登录
 * @param {string} method - 'silence'/'must'/'cancel'/'back'
 * @param {string} title - 加载提示
 * @param {Object} that - 页面/组件 this
 */
const loginCheck = async (mustLogin = false, method = 'back', title = '', that = null) => {
  const token = cache.get(constants.CACHE_TOKEN);
  if (token && method !== 'must') {
    if (that) that.setData({ isLogin: true });
    return true;
  }
  if (that) that.setData({ isLogin: false });

  const opt = { title: title || '登录中' };

  try {
    const result = await cloud.callCloudSubmit('passport/login', {}, opt);

    clearToken();
    if (result && isDefined(result.data.token) && result.data.token?.status === 1) {
      setToken(result.data.token);
      if (that) that.setData({ isLogin: true });
      return true;
    }

    // 已注册但状态异常
    if (mustLogin && result?.data?.token && [0, 8, 9].includes(result.data.token.status)) {
      return loginStatusHandler(method, result.data.token.status);
    }

    // 未注册 — 根据 method 不同处理
    if (mustLogin && method === 'cancel') {
      wx.showModal({
        title: '温馨提示',
        content: '此功能仅限注册用户',
        confirmText: '马上注册',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            wx.navigateTo({ url: '/pages/my/register/my_register?retUrl=back' });
          }
        },
      });
      return false;
    }

    if (mustLogin && method === 'back') {
      wx.showModal({
        title: '温馨提示',
        content: '此功能仅限注册用户',
        confirmText: '马上注册',
        cancelText: '返回',
        success: (modalRes) => {
          if (modalRes.confirm) {
            const retUrl = encodeURIComponent(router.getCurrentPageUrlWithArgs());
            wx.redirectTo({ url: `/pages/my/register/my_register?retUrl=${retUrl}` });
          } else {
            const len = getCurrentPages().length;
            if (len === 1) wx.reLaunch({ url: '/pages/index/index' });
            else wx.navigateBack();
          }
        },
      });
      return false;
    }

    return false;
  } catch (err) {
    console.error('loginCheck error:', err);
    clearToken();
    return false;
  }
};

/** 静默登录（已登录则跳过） */
const loginSilence = (that) => loginCheck(false, 'silence', 'bar', that);

/** 强制静默登录 */
const loginSilenceMust = (that) => loginCheck(false, 'must', 'bar', that);

/** 必须登录 — 弹窗可取消 */
const loginMustCancelWin = (that) => loginCheck(true, 'cancel', '', that);

/** 必须登录 — 只能注册或返回 */
const loginMustBackWin = (that) => loginCheck(true, 'back', '', that);

/** 获取手机号 */
const getPhone = async (e, that) => {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    const cloudID = e.detail.cloudID;
    const opt = { title: '手机验证中' };
    try {
      const res = await cloud.callCloudSubmit('passport/phone', { cloudID }, opt);
      const phone = res.data;
      if (!phone || phone.length < 11) {
        wx.showToast({ title: '手机号码获取失败，请重新填写手机号码', icon: 'none', duration: 2000 });
      } else {
        that.setData({ formMobile: phone });
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    wx.showToast({ title: '手机号码获取失败，请重新填写手机号码', icon: 'none' });
  }
};

/** 注册/编辑资料表单校验规则 */
const CHECK_FORM = {
  name: 'formName|must|string|min:1|max:30|name=昵称',
  mobile: 'formMobile|must|len:11|name=手机',
};

module.exports = {
  getToken,
  setToken,
  clearToken,
  getUserId,
  getUserName,
  getStatus,
  isLogin,
  loginCheck,
  loginSilence,
  loginSilenceMust,
  loginMustCancelWin,
  loginMustBackWin,
  getPhone,
  CHECK_FORM,
};
