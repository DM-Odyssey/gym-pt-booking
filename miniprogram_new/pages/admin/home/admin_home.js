const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const admin = require('../../../biz/admin.js');
Component({ data: { isLoad: false, admin: null, stat: null },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this._loadDetail(); },
    async _loadDetail() {
      const token = admin.getAdminToken();
      this.setData({ isLoad: true, admin: token });
      try {
        const res = await cloud.callCloudData('admin/home', {}, { title: 'bar' });
        this.setData({ stat: res });
      } catch (err) { console.error(err); }
    },
    url(e) { router.url(e, this); },
    bindExitTap() {
      wx.showModal({ title:'', content:'您确认退出?', success: (r) => { if(r.confirm){ admin.clearAdminToken(); wx.reLaunch({ url:'/pages/my/index/my_index' }); } } });
    },
    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
    onShareAppMessage() {},
  }
});
