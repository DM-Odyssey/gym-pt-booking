const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const work = require('../../../biz/work.js');
Component({ data: { isLoad: false, work: null, stat: null },
  methods: {
    onLoad() { if (!work.isWork(this)) return; this._loadDetail(); },
    async _loadDetail() {
      const token = work.getWorkToken();
      this.setData({ isLoad: true, work: token });
      try {
        const res = await cloud.callCloudData('work/home', {}, { title: 'bar' });
        this.setData({ stat: res });
      } catch (err) { console.error(err); }
    },
    url(e) { router.url(e, this); },
    bindExitTap() {
      wx.showModal({ title:'', content:'确认退出?', success: (r) => { if(r.confirm){ work.clearWorkToken(); wx.reLaunch({ url:'/pages/my/index/my_index' }); } } });
    },
    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
  }
});
