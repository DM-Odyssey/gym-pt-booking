/**
 * 首页
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');

Component({
  data: {
    dataList: null,
    isLoad: false,
  },

  lifetimes: {
    attached() {
      // Component 生命周期
    },
  },

  pageLifetimes: {
    show() {
      this._loadList();
    },
  },

  methods: {
    async _loadList() {
      const opts = { title: 'bar' };
      try {
        const res = await cloud.callCloudSubmit('home/list', {}, opts);
        this.setData({
          dataList: res.data,
          isLoad: true,
        });
      } catch (err) {
        console.error(err);
      }
    },

    url(e) {
      router.url(e, this);
    },

    onPullDownRefresh() {
      this._loadList().then(() => wx.stopPullDownRefresh());
    },

    onShareAppMessage() {},
  },
});
