const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const list = require('../../../../utils/list.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');

Component({ data: { isLoad: false, _params: null, sortMenus: [], sortItems: [], dataList: null, search: '' },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { list.commListListener(this, e); },
    bindStatusTap(e) {
      const id = e.currentTarget.dataset.id;
      const status = e.currentTarget.dataset.status;
      cloud.callCloudSubmit('admin/mgr_status', { id, status }, { title: '处理中' }).then(() => {
        toast.showSuccToast('操作成功');
        this.selectComponent('#cmpt-comm-list')?.reload();
      }).catch(err => console.error(err));
    },
    bindDelTap(e) {
      const id = e.currentTarget.dataset.id;
      toast.showConfirm('确认删除？', () => {
        cloud.callCloudSubmit('admin/mgr_del', { id }, { title: '删除中' }).then(() => {
          list.delPrevPageListNode(id, 1, 'dataList');
          toast.showSuccToast('删除成功');
        }).catch(err => console.error(err));
      });
    },
    onShareAppMessage() {},
  }
});
