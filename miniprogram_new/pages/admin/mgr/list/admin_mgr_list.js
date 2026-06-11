const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const list = require('../../../../utils/list.js');
const dom = require('../../../../utils/dom.js');
const admin = require('../../../../biz/admin.js');

Component({
  data: { isSuperAdmin: false, isLoad: false, dataList: { list: [] }, sortMenus: [], sortItems: [], search: '' },
  methods: {
    onLoad() {
      if (!admin.isAdmin(this, true)) return;
      this.setData(this._getSearchMenu());
    },
    _getSearchMenu() {
      return {
        search: '', sortItems: [],
        sortMenus: [
          { label: '全部', type: '', value: '' },
          { label: '超管', type: 'type', value: 1 },
          { label: '普通', type: 'type', value: 0 },
          { label: '正常', type: 'status', value: 1 },
          { label: '停用', type: 'status', value: 0 },
        ],
        isLoad: true,
      };
    },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { if (!admin.isAdmin(this, true)) return; list.commListListener(this, e); },
    async bindStatusTap(e) {
      if (!admin.isAdmin(this, true)) return;
      const id = dom.dataset(e, 'id');
      const status = Number(dom.dataset(e, 'status'));
      if (!id || !status) return;
      try {
        await cloud.callCloudSubmit('admin/mgr_status', { id, status });
        list.modifyListNode(id, this.data.dataList.list, 'ADMIN_STATUS', status, '_id');
        this.setData({ dataList: this.data.dataList });
        toast.showSuccToast('设置成功');
      } catch (err) { console.error(err); }
    },
    async bindDelTap(e) {
      if (!admin.isAdmin(this, true)) return;
      const id = e.currentTarget.dataset.id;
      if (!id) return;
      toast.showConfirm('确认删除？删除不可恢复', async () => {
        try {
          await cloud.callCloudSubmit('admin/mgr_del', { id });
          list.delListNode(id, this.data.dataList.list, '_id');
          this.data.dataList.total--;
          this.setData({ dataList: this.data.dataList });
          toast.showSuccToast('删除成功');
        } catch (err) { console.error(err); }
      });
    },
  }
});
