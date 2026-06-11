const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const work = require('../../../../biz/work.js');

Component({ data: { isLoad: false },
  methods: {
    onLoad(options) {
      if (!work.isWork(this)) return;
      if (options && options.id) this.setData({ id: options.id, isEdit: true });
      this.setData({ isLoad: true });
    },
    url(e) { router.url(e, this); },
    async bindSubmitTap() {
      const params = { title: this.data.formTitle };
      if (this.data.id) params.id = this.data.id;
      await cloud.callCloudSubmit('work/meet_edit', params, { title: '提交中' });
      toast.showSuccToast('操作成功', 1500, () => wx.navigateBack());
    },
  }
});
