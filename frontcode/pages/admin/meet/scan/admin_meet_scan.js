const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../services/admin.js');
const pageInit = require('../../../../utils/page_init.js');

Component({ data: { isLoad: true, oprt: 'admin', meetId: '', title: '' },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options, 'meetId')) return;
      if (options && options.title) this.setData({ title: decodeURIComponent(options.title) });
    },
    url(e) { router.url(e, this); },
    bindScanTap() {
      const meetId = this.data.meetId;
      wx.scanCode({
        success: async (res) => {
          if (!res || !res.result || !res.result.includes('meet=') || res.result.length !== 20) {
            toast.showModal('错误的预约码，请重新扫码'); return;
          }
          try {
            await cloud.callCloudSubmit(this.data.oprt + '/join_scan', { meetId, code: res.result.replace('meet=', '') }, { title: '预约码核销中' });
            toast.showModal('核销成功');
          } catch (err) { console.error(err); }
        },
        fail(err) { if (err && err.errMsg === 'scanCode:fail') toast.showModal('预约码核销错误，请重新扫码'); }
      });
    },
  }
});
