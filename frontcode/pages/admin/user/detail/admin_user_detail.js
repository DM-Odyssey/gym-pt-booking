const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const admin = require('../../../../services/admin.js');
const pageInit = require('../../../../utils/page_init.js');

Component({ data: { isLoad: false, user: null },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options)) return;
      this._loadDetail();
    },
    async _loadDetail() {
      if (!admin.isAdmin(this)) return;
      const id = this.data.id; if (!id) return;
      const user = await cloud.callCloudData('admin/user_detail', { id }, { hint: false });
      if (!user) { this.setData({ isLoad: null }); return; }
      this.setData({ isLoad: true, user });
    },
    url(e) { router.url(e, this); },
    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
    onShareAppMessage() {},
  }
});
