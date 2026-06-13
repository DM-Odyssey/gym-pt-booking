/**
 * 个人中心
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cache = require('../../../utils/cache.js');
const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const auth = require('../../../services/auth.js');

Component({
  data: {
    user: null,
    cards: [],
    cardLoaded: false,
    totalRemain: 0,
  },

  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 3 });
      }
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
        this.setData({ user: null, cards: [], cardLoaded: true, totalRemain: 0 });
        return;
      }
      this.setData({ user });
      // 并行加载卡信息
      try {
        const cardData = await cloud.callCloudData('passport/my_card', {}, { title: 'bar' });
        const tr = cardData.totalRemain || {};
        this.setData({
          cards: cardData.cards || [],
          cardLoaded: true,
          totalRemain: (tr.coach || 0) + (tr.course || 0) + (tr.general || 0),
        });
      } catch (e) {
        this.setData({ cardLoaded: true });
      }
    },

    url(e) {
      router.url(e, this);
    },

    bindSetTap() {
      const itemList = ['个人资料', '清除缓存', '后台管理'];
      wx.showActionSheet({
        itemList,
        success: (res) => {
          const idx = res.tapIndex;
          if (idx === 0) {
            wx.navigateTo({ url: '/pages/my/edit/my_edit' });
          } else if (idx === 1) {
            cache.clear();
            wx.showToast({ title: '缓存已清除', icon: 'none' });
          } else if (idx === 2) {
            wx.reLaunch({ url: '/pages/admin/login/admin_login' });
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
