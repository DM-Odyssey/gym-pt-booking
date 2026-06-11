const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const admin = require('../../../../biz/admin.js');

Component({ data: { isLoad: false, qrUrl: '' },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (options && options.qr) this.setData({ qr: decodeURIComponent(options.qr) });
      this._loadDetail();
    },
    async _loadDetail() {
      if (this.data.qrUrl) { this.setData({ isLoad: true }); return; }
      try {
        const res = await cloud.callCloudSubmit('admin/setup_qr', { path: '/pages/index/index' }, { title: 'bar' });
        this.setData({ qrUrl: res.data, isLoad: true });
      } catch (err) { console.error(err); }
    },
    url(e) { router.url(e, this); },
    bindGenTap() { this._loadDetail(); },
    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
  }
});
