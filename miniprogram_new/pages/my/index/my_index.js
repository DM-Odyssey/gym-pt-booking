/**
 * 个人中心
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cache = require('../../utils/cache.js');
const router = require('../../utils/router.js');
const cloud = require('../../utils/cloud.js');
const auth = require('../../biz/auth.js');

Component({
  data: {
    user: null,
  },

  pageLifetimes: {
    show() {
      auth.loginSilenceMust(this);
      this._loadUser();
    },
  },

  methods: {
    onLoad() {
      if (auth.isLogin()) {
        this.setData({
          user: { USER_NAME: auth.getUserName() },
        });
      }
    },

    async _loadUser() {
      const opts = { title: 'bar' };
      const user = await cloud.callCloudData('passport/my_detail', {}, opts);
      if (!user) {
        this.setData({ user: null });
        return;
      }
      this.setData({ user });
    },

    url(e) {
      router.url(e, this);
    },

    bindSetTap() {
      const itemList = ['清除缓存', '后台管理', '教练平台'];
      wx.showActionSheet({
        itemList,
        success: (res) => {
          const idx = res.tapIndex;
          if (idx === 0) {
            cache.clear();
            wx.showToast({ title: '清除缓存成功', icon: 'none' });
          }
          if (idx === 1) {
            wx.reLaunch({ url: '/pages/admin/login/admin_login' });
          }
          if (idx === 2) {
            wx.reLaunch({ url: '/pages/work/login/work_login' });
          }
        },
      });
    },

    onPullDownRefresh() {
      this._loadUser().then(() => wx.stopPullDownRefresh());
    },

    onShareAppMessage() {},
  },
});
