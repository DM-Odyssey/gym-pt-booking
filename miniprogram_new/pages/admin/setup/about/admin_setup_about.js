const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');
const pageInit = require('../../../../utils/page_init.js');

Component({ data: { isLoad: false, key: '', formContent: [] },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      const key = (options && options.key) ? options.key : 'SETUP_CONTENT_ABOUT';
      this.setData({ key });
      wx.setNavigationBarTitle({ title: '编辑关于我们' });
      this._loadDetail();
    },
    async _loadDetail() {
      if (!admin.isAdmin(this)) return;
      try {
        const key = this.data.key;
        const res = await cloud.callCloudSubmit('home/setup_get', { key }, { title: 'bar' });
        let formContent = [{ type: 'text', val: '关于我们' }];
        const content = res.data;
        if (content && Array.isArray(content)) {
          formContent = content;
        }
        this.setData({ isLoad: true, formContent });
      } catch (err) {
        console.error(err);
      }
    },
    url(e) { router.url(e, this); },
    async bindFormSubmit() {
      if (!admin.isAdmin(this)) return;
      const formContent = this.selectComponent('#contentEditor').getNodeList();
      await cloud.transRichEditorTempPics(formContent, 'setup/', this.data.key, 'admin/setup_set_content');
      toast.showSuccToast('修改成功', 1500, function() { wx.navigateBack(); });
    },
    onPullDownRefresh() { this._loadDetail().then(function() { wx.stopPullDownRefresh(); }); },
  }
});