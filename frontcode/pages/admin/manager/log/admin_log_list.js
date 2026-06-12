const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const list = require('../../../../utils/list.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../services/admin.js');

Component({
  data: { isLoad: false, search: '', sortItems: [], sortMenus: [], dataList: { list: [] } },
  methods: {
    onLoad() {
      if (!admin.isAdmin(this)) return;
      this.setData(this._getSearchMenu());
    },
    _getSearchMenu() {
      const sortItems = [];
      const sortMenus = [
        { label: '全部', type: '', value: '' },
        { label: '系统', type: 'type', value: 0 },
        { label: '用户', type: 'type', value: 1 },
        { label: '文章', type: 'type', value: 2 },
        { label: '其他', type: 'type', value: 99 }
      ];
      return { search: '', sortItems, sortMenus, isLoad: true };
    },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { list.commListListener(this, e); },
    bindClearTap() {
      const cb = async () => {
        try {
          await cloud.callCloudSubmit('admin/log_clear');
          toast.showSuccToast('清空完成', 1500, function() {
            wx.redirectTo({ url: '/pages/admin/manager/log/admin_log_list' });
          });
        } catch (err) { console.error(err); }
      };
      toast.showConfirm('确认清空？清空不可恢复', cb);
    },
    onShareAppMessage() {},
  }
});