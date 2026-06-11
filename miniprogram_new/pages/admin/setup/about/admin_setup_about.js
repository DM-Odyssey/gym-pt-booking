const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');

Component({ data: { isLoad: false, key: 'SETUP_CONTENT_ABOUT', formContent: [] },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (options && options.key) this.setData({ key: options.key });
      this._loadDetail();
    },
    async _loadDetail() {
      try {
        const res = await cloud.callCloudSubmit('home/setup_get', { key: this.data.key }, { title: 'bar' });
        let content = res.data;
        if (!Array.isArray(content)) content = [{ type: 'text', val: '' }];
        this.setData({ isLoad: true, formContent: content });
      } catch (err) { console.error(err); }
    },
    url(e) { router.url(e, this); },
    async bindSubmitTap() {
      const content = this.selectComponent('#cmpt-form')?.getForms?.(true) || this.data.formContent;
      await cloud.callCloudSubmit('admin/setup_set_content', { key: this.data.key, content });
      toast.showSuccToast('修改成功', 1500, () => wx.navigateBack());
    },
    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
  }
});
