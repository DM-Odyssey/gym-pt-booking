/**
 * 页面路由与导航工具
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const { isDefined } = require('./helper.js');
const { showNoneToast, showModal } = require('./toast.js');
const { getWritePhotosAlbum } = require('./pic.js');

/** 获取自定义导航栏高度 */
const getCustomNavHeight = () => {
  const sysInfo = wx.getSystemInfoSync();
  const menuInfo = wx.getMenuButtonBoundingClientRect();
  return menuInfo.top + menuInfo.bottom - sysInfo.statusBarHeight;
};

/** 获取当前页面路径（不含参数） */
const getCurrentPageURL = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return `/${currentPage.route}`;
};

/** 获取当前页面完整路径（含参数） */
const getCurrentPageUrlWithArgs = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const url = currentPage.route;
  const options = currentPage.options;
  const parts = Object.keys(options).map((k) => `${k}=${options[k]}`);
  return `/${url}?${parts.join('&')}`;
};

/** 获取上一级页面 */
const getPrevPage = (deep = 2) => {
  const pages = getCurrentPages();
  return pages[pages.length - deep];
};

/** 页面跳转函数——兼容旧 fmtURLByPID（新架构直接透传） */
const fmtURLByPID = (url) => url;

/** 智能跳转：在页面栈中找到或重定向到目标 */
const toURL = (url) => {
  const pages = getCurrentPages();
  for (let k = pages.length - 1; k >= 0; k--) {
    if (pages[k].route.includes(url)) {
      wx.navigateBack({ delta: pages.length - k - 1 });
      return;
    }
  }
  wx.redirectTo({ url });
};

/** 销毁定时器 */
const clearTimer = (that, timerName = 'timer') => {
  if (isDefined(that.data[timerName])) {
    clearInterval(that.data[timerName]);
  }
};

/** 滚动到锚点 */
const anchor = (id, that) => {
  try {
    const query = wx.createSelectorQuery().in(that);
    query.selectViewport().scrollOffset();
    query.select('#' + id).boundingClientRect();
    query.exec((res) => {
      if (!res || res.length < 2 || !res[0] || !res[1]) return;
      const target = res[0].scrollTop + res[1].top - 10;
      wx.pageScrollTo({ scrollTop: target, duration: 300 });
    });
  } catch (err) {
    console.error('anchor error:', err);
  }
};

// 导航动作分发映射表
const ACTIONS = {
  picker: (e, that) => {
    const item = e.currentTarget.dataset.item;
    that.setData({ [item]: e.detail });
  },
  top: () => wx.pageScrollTo({ scrollTop: 0 }),
  mini: (e) => {
    wx.navigateToMiniProgram({
      appId: e.currentTarget.dataset.app,
      path: e.currentTarget.dataset.url,
      envVersion: 'release',
    });
  },
  redirect: (e) => {
    const url = e.currentTarget.dataset.url;
    if (url) wx.redirectTo({ url });
  },
  reLaunch: (e) => {
    const url = e.currentTarget.dataset.url;
    if (url) wx.reLaunch({ url });
  },
  relaunch: (e) => {
    const url = e.currentTarget.dataset.url;
    if (url) wx.reLaunch({ url });
  },
  copy: (e) => {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.getClipboardData({
          success: () => showNoneToast('已复制到剪贴板'),
        });
      },
    });
  },
  hint: (e) => {
    const url = e.currentTarget.dataset.url;
    if (url) showModal(url);
  },
  switch: (e) => {
    const url = e.currentTarget.dataset.url;
    if (url) wx.switchTab({ url });
  },
  back: () => wx.navigateBack(),
  toURL: (e) => toURL(e.currentTarget.dataset.url),
  phone: (e) => wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.url }),
  anchor: (e, that) => anchor(e.currentTarget.dataset.url, that),
  saveimg: (e) => {
    const url = e.currentTarget.dataset.url;
    const hint = e.currentTarget.dataset.hint || '保存成功';
    const callback = () => {
      wx.saveImageToPhotosAlbum({
        filePath: url,
        success: () => wx.showToast({ title: hint, icon: 'none', duration: 2000 }),
        fail: (err) => console.log(err),
      });
    };
    getWritePhotosAlbum(callback);
  },
  saveimage: (e) => ACTIONS.saveimg(e),
  bool: (e, that) => {
    const key = e.currentTarget.dataset.url;
    that.setData({ [key]: !that.data[key] });
  },
  img: (e) => {
    let url = e.currentTarget.dataset.url;
    if (url.includes('qlogo')) url = url.replace('/132', '/0');
    const urls = e.currentTarget.dataset.imgs || [url];
    wx.previewImage({ current: url, urls });
  },
  image: (e) => ACTIONS.img(e),
};

/**
 * 统一导航事件处理函数
 * WXML: bindtap="url" data-type="redirect|back|copy|..." data-url="..."
 */
const url = (e, that) => {
  const type = e.currentTarget.dataset.type || 'url';
  const action = ACTIONS[type];
  if (action) {
    action(e, that);
  } else {
    const targetUrl = e.currentTarget.dataset.url;
    if (targetUrl) wx.navigateTo({ url: targetUrl });
  }
};

module.exports = {
  getCustomNavHeight,
  getCurrentPageURL,
  getCurrentPageUrlWithArgs,
  getPrevPage,
  fmtURLByPID,
  toURL,
  clearTimer,
  anchor,
  url,
};
