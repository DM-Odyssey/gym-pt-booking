/**
 * 预约日历
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');
const timeHelper = require('../../utils/time.js');

Component({
  data: {
    isLoad: false,
    list: [],
    day: '',
    hasDays: [],
  },

  pageLifetimes: {
    show() {
      this.setData({ day: timeHelper.time('Y-M-D') }, () => {
        this._loadHasList();
        this._loadList();
      });
    },
  },

  methods: {
    async _loadList() {
      const params = { day: this.data.day };
      const opts = { title: 'bar' };
      try {
        this.setData({ list: null });
        const res = await cloud.callCloudSubmit('meet/list_by_day', params, opts);
        this.setData({ list: res.data, isLoad: true });
      } catch (err) {
        console.error(err);
      }
    },

    async _loadHasList() {
      const params = { day: timeHelper.time('Y-M-D') };
      const opts = { title: 'bar' };
      try {
        const res = await cloud.callCloudSubmit('meet/list_has_day', params, opts);
        this.setData({ hasDays: res.data });
      } catch (err) {
        console.error(err);
      }
    },

    bindClickCmpt(e) {
      const day = e.detail.day;
      this.setData({ day }, () => this._loadList());
    },

    bindMonthChangeCmpt() {},

    url(e) {
      router.url(e, this);
    },

    onPullDownRefresh() {
      this._loadHasList().then(() => this._loadList()).then(() => wx.stopPullDownRefresh());
    },

    onShareAppMessage() {},
  },
});
