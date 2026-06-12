const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const toast = require('../../../utils/toast.js');
const work = require('../../../services/work.js');

Component({ data: { isLoad: false, work: null, stat: null, id: '' },
  methods: {
    onLoad() { if (!work.isWork(this)) return; this._loadDetail(); },
    async _loadDetail() {
      var token = work.getWorkToken();
      if (!token) return;
      this.setData({ isLoad: true, work: token, id: token.id });
      try {
        var res = await cloud.callCloudData('work/home', {}, { title: 'bar' });
        this.setData({ stat: res });
      } catch (err) { console.error(err); }
    },
    url(e) { router.url(e, this); },
    bindExitTap() {
      toast.showConfirm('确认退出?', function() { work.clearWorkToken(); wx.reLaunch({ url: '/pages/my/index/my_index' }); });
    },
    onPullDownRefresh() { this._loadDetail().then(function() { wx.stopPullDownRefresh(); }); },
  }
});
