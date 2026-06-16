/**
 * 首页
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');

Component({
  data: {
    dataList: null,
    coachList: [],
    courseList: [],
    isLoad: false,
  },

  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 0 });
      }
      this._loadList();
    },
  },

  methods: {
    async _loadList() {
      const opts = { title: 'bar' };
      try {
        const res = await cloud.callCloudSubmit('home/list', {}, opts);
        const result = (res && res.data) || res || {};
        this.setData({
          dataList: result.list || [],
          coachList: result.coachList || [],
          courseList: result.courseList || [],
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
