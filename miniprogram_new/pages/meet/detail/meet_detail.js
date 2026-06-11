/**
 * 课程详情
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');
const timeHelper = require('../../utils/time.js');
const pageInit = require('../../utils/page_init.js');
const auth = require('../../biz/auth.js');

Component({
  data: {
    isLoad: false,
    meet: null,
    days: [],
    dayIdx: 0,
    timeIdx: -1,
    cur: 'mind',
    topBtnShow: false,
    canNullTime: false,
  },

  methods: {
    onLoad(options) {
      if (!pageInit.initPageOptions(this, options)) return;
      this._loadDetail();
    },

    async _loadDetail() {
      this.setData({ dayIdx: 0, timeIdx: -1, isLoad: false });
      const id = this.data.id;
      if (!id) return;

      const params = { id };
      const opt = { title: 'bar' };
      const meet = await cloud.callCloudData('meet/view', params, opt);
      if (!meet) {
        this.setData({ isLoad: null });
        return;
      }

      const days = meet.MEET_DAYS_SET || [];
      const now = timeHelper.time('Y-M-D');
      const tmr = timeHelper.time('Y-M-D', 86400);
      const dat = timeHelper.time('Y-M-D', 86400 * 2);

      days.forEach((d) => {
        if (d.day === now) d.status = '今天';
        else if (d.day === tmr) d.status = '明天';
        else if (d.day === dat) d.status = '后天';
        d.week = timeHelper.week(d.day);
        d.date = d.day.split('-')[1] + '-' + d.day.split('-')[2];
      });

      this.setData({ isLoad: true, meet, days });
    },

    bindDayTap(e) {
      const dayIdx = router.getPrevPage(1) || e.currentTarget.dataset.idx;
      // Use dataset
      const idx = e.currentTarget.dataset.idx;
      this.setData({ dayIdx: idx, timeIdx: -1 });
    },

    bindTimeTap(e) {
      const timeIdx = e.currentTarget.dataset.timeidx;
      const node = this.data.days[this.data.dayIdx].times[timeIdx];
      if (node.error) return;
      this.setData({ timeIdx });
    },

    async bindJoinTap() {
      if (!(await auth.loginMustCancelWin(this))) return;

      this.setData({ cur: 'time' });
      const dayIdx = this.data.dayIdx;
      const timeIdx = this.data.timeIdx;
      if (timeIdx < 0) return wx.showToast({ title: '请先选择预约时段', icon: 'none' });

      const time = this.data.days[dayIdx].times[timeIdx];
      if (time.error) {
        const msg = time.error.includes('预约') ? `该时段${time.error}，换一个时段试试吧！` : `该时段预约${time.error}，换一个时段试试吧！`;
        return wx.showModal({ title: '温馨提示', content: msg, showCancel: false });
      }

      const meetId = this.data.id;
      const timeMark = time.mark;
      try {
        const opts = { title: '请稍候' };
        await cloud.callCloudSubmit('meet/before_join', { meetId, timeMark }, opts);
        wx.navigateTo({ url: `/pages/meet/join/meet_join?id=${meetId}&timeMark=${timeMark}` });
      } catch (ex) {
        console.error(ex);
      }
    },

    bindTabTap(e) {
      const cur = e.currentTarget.dataset.cur;
      this.setData({ cur });
    },

    url(e) {
      router.url(e, this);
    },

    onPullDownRefresh() {
      this._loadDetail().then(() => wx.stopPullDownRefresh());
    },

    onPageScroll(e) {
      this.setData({ topBtnShow: e.scrollTop > 100 });
    },

    onShareAppMessage() {},
  },
});
