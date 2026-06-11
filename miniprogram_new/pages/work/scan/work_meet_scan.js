const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const work = require('../../../../biz/work.js');

Component({ data: { isLoad: true, oprt: 'work', meetId: '' },
  methods: {
    onLoad(options) {
      if (!work.isWork(this)) return;
      if (options && options.meetId) this.setData({ meetId: options.meetId });
    },
    url(e) { router.url(e, this); },
    bindScanTap() {
      wx.scanCode({
        success: async (res) => {
          if (!res || !res.result || !res.result.includes('meet=') || res.result.length !== 20) {
            toast.showModal('错误的预约码，请重新扫码'); return;
          }
          try {
            await cloud.callCloudSubmit('work/join_scan', { meetId: this.data.meetId, code: res.result.replace('meet=', '') }, { title: '预约码核销中' });
            toast.showModal('核销成功');
          } catch (err) { console.error(err); }
        },
        fail(err) { if (err && err.errMsg === 'scanCode:fail') toast.showModal('预约码核销错误'); }
      });
    },
  }
});
