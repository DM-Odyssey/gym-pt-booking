/**
 * 小程序入口
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const setting = require('./config/setting.js');

App({
  onLaunch(options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: setting.CLOUD_ID,
      traceUser: true,
    });

    this.globalData = {};

    // 自定义导航栏高度
    const sysInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight;

    const capsule = wx.getMenuButtonBoundingClientRect();
    if (capsule) {
      this.globalData.customBarHeight = capsule.bottom + capsule.top - sysInfo.statusBarHeight;
      this.globalData.capsule = capsule;
    } else {
      this.globalData.customBarHeight = sysInfo.statusBarHeight + 50;
    }
  },
});
