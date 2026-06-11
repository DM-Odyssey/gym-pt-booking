const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const list = require('../../../../utils/list.js');
const dom = require('../../../../utils/dom.js');
const cache = require('../../../../utils/cache.js');
const admin = require('../../../../biz/admin.js');

Component({
  data: { isLoad: false, userRegCheck: false, checkModalShow: false, formReason: '', curIdx: -1, dataList: null, sortMenus: [], sortItems: [], search: '' },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this._getSearchMenu(); },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { list.commListListener(this, e); },

    _getSearchMenu() {
      var sortItems1 = [
        { label: '注册时间', type: '', value: '' },
        { label: '注册时间从早到晚', type: 'sort', value: 'USER_ADD_TIME|asc' },
        { label: '注册时间从晚到早', type: 'sort', value: 'USER_ADD_TIME|desc' },
      ];
      var sortMenus = [
        { label: '全部', type: '', value: '' },
        { label: '正常', type: 'status', value: 1 },
        { label: '禁用', type: 'status', value: 9 },
      ];
      this.setData({ search: '', sortItems: [sortItems1], sortMenus, isLoad: true });
    },

    async bindDelTap(e) {
      var id = dom.dataset(e, 'id'); if (!id) return;
      toast.showConfirm('确认删除？删除不可恢复', async () => {
        try {
          await cloud.callCloudSubmit('admin/user_del', { id: id }, { title: '删除中' });
          list.delListNode(id, this.data.dataList.list, 'USER_MINI_OPENID');
          this.data.dataList.total--;
          this.setData({ dataList: this.data.dataList });
          toast.showSuccToast('删除成功');
        } catch (err) { console.error(err); }
      });
    },

    bindClearReasonTap() { this.setData({ formReason: '' }); },

    bindCheckTap(e) {
      var idx = dom.dataset(e, 'idx');
      this.setData({ formReason: cache.get('CACHE_USER_CHECK_REASON') || '', curIdx: idx, checkModalShow: true });
    },

    bindCheckCmpt: async function() {
      var self = this;
      cache.set('CACHE_USER_CHECK_REASON', self.data.formReason, 86400 * 365);
      self.bindStatusTap({ currentTarget: { dataset: { status: 8, idx: self.data.curIdx } } });
    },

    async bindStatusTap(e) {
      var self = this;
      var status = dom.dataset(e, 'status');
      var idx = Number(dom.dataset(e, 'idx'));
      var dl = self.data.dataList;
      var id = dl.list[idx].USER_MINI_OPENID;
      var params = { id: id, status: status, reason: self.data.formReason };

      var cb = async function() {
        try {
          await cloud.callCloudSubmit('admin/user_status', params);
          var sortIndex = self.selectComponent('#cmpt-comm-list').getSortIndex();
          if (sortIndex != -1 && sortIndex != 5 && !self.data.search) {
            dl.list.splice(idx, 1); dl.total--;
          } else {
            dl.list[idx].USER_CHECK_REASON = self.data.formReason;
            dl.list[idx].USER_STATUS = status;
          }
          self.setData({ dataList: dl, checkModalShow: false, formReason: '', curIdx: -1 });
          toast.showSuccToast('操作成功');
        } catch (err) { console.error(err); }
      };

      if (status == 8) toast.showConfirm('该用户审核不通过，用户修改资料后可重新提交审核', cb);
      else toast.showConfirm('确认执行此操作?', cb);
    },
  }
});
