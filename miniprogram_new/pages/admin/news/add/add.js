const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const admin = require('../../../biz/admin.js');
Component({ data: { isLoad: false, isEdit: false, formTitle: '', formContent: [] },
  methods: {
    onLoad(options) { if (!admin.isAdmin(this)) return; if (options && options.id) this.setData({ id: options.id }); this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
    bindSubmitTap() {
      const data = this.data;
      const params = { title: data.formTitle };
      if (data.id) params.id = data.id;
      const opts = { title: '提交中' };
      cloud.callCloudSubmit('admin/news_insert', params, opts).then(() => {
        wx.showToast({ title: '操作成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }).catch(err => console.error(err));
    },
    onShareAppMessage() {},
  }
});
