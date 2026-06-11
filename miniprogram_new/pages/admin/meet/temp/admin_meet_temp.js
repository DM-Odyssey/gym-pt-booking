const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');

Component({ data: { isLoad: false, oprt: 'admin', tempList: [] },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
    bindSelectTap(e) {
      const idx = e.currentTarget.dataset.idx;
      const temp = this.data.tempList[idx];
      if (temp) {
        cloud.callCloudSubmit('admin/meet_temp_edit', { id: temp._id }, { title: '处理中' }).then(() => {
          toast.showSuccToast('操作成功');
        });
      }
    },
  }
});
