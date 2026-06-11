const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');
const pageInit = require('../../../../utils/page_init.js');

Component({ data: { isLoad: false, oprt: 'admin', meetId: '' },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options, 'meetId')) return;
      this.setData({ isLoad: true });
    },
    url(e) { router.url(e, this); },
    bindSetDaysTap() {
      const meetId = this.data.meetId;
      cloud.callCloudSubmit('admin/meet_set_days', { meetId }, { title: '处理中' }).then(() => {
        toast.showSuccToast('操作成功');
      }).catch(err => console.error(err));
    },
  }
});
