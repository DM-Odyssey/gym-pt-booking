const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const list = require('../../../../utils/list.js');
const dom = require('../../../../utils/dom.js');
const admin = require('../../../../services/admin.js');
const meet = require('../../../../services/meet.js');

Component({
  data: { isLoad: false, MEET_NAME: '课程', cateIdOptions: [], dataList: null, sortMenus: [], sortItems: [], search: '' },
  methods: {
    onLoad() {
      if (!admin.isAdmin(this)) return;
      wx.setNavigationBarTitle({ title: '课程-管理' });
      this.setData({ MEET_NAME: '课程' });
      this._getSearchMenu();
    },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { list.commListListener(this, e); },

    _getSearchMenu() {
      var cateIdOptions = meet.MEET_CATE;
      var sortItem1 = [{ label: '分类', type: '', value: '' }];
      sortItem1 = sortItem1.concat(meet.MEET_CATE.map(function(i){return{label:i.title,type:'cateId',value:i.id};}));
      var sortItems = sortItem1.length > 2 ? [sortItem1] : [];
      this.setData({
        search: '', cateIdOptions: cateIdOptions, sortItems: sortItems,
        sortMenus: [{ label:'全部', type:'', value:'' }, { label:'使用中', type:'status', value:1 }, { label:'已停止', type:'status', value:9 }, { label:'已关闭', type:'status', value:10 }],
        isLoad: true,
      });
    },

    bindScanTap(e) { var meetId = dom.dataset(e, 'id'); var title = encodeURIComponent(dom.dataset(e, 'title')); wx.navigateTo({ url: '/pages/admin/meet/scan/admin_meet_scan?meetId=' + meetId + '&title=' + title }); },

    bindRecordSelectTap(e) {
      var self = this; var meetId = dom.dataset(e, 'id'); var title = encodeURIComponent(dom.dataset(e, 'title'));
      wx.showActionSheet({ itemList: ['预约名单', '导出名单Excel文件', '管理员核销预约码'],
        success: function(res) { switch(res.tapIndex) { case 0: wx.navigateTo({ url: '/pages/admin/meet/join/admin_meet_join?meetId=' + meetId + '&title=' + title }); break; case 1: wx.navigateTo({ url: '/pages/admin/meet/export/admin_join_export?meetId=' + meetId + '&title=' + title }); break; case 2: wx.navigateTo({ url: '/pages/admin/meet/scan/admin_meet_scan?meetId=' + meetId + '&title=' + title }); break; } }
      });
    },

    _setStatus: async function(that, meetId, status) { if (!meetId) return;
      try { await cloud.callCloudSubmit('admin/meet_status', { meetId: meetId, status: status }); list.modifyListNode(meetId, that.data.dataList.list, 'MEET_STATUS', status, '_id'); that.setData({ dataList: that.data.dataList }); toast.showSuccToast('设置成功'); } catch(err) { console.error(err); } },
    _del: async function(that, meetId) { if (!meetId) return;
      toast.showConfirm('确认删除？删除不可恢复', async function() { try { await cloud.callCloudSubmit('admin/meet_del', { meetId: meetId }, { title: '删除中' }); list.delListNode(meetId, that.data.dataList.list, '_id'); that.data.dataList.total--; that.setData({ dataList: that.data.dataList }); toast.showSuccToast('删除成功'); } catch(err) { console.error(err); } }); },

    bindStatusSelectTap(e) {
      var self = this; var meetId = dom.dataset(e, 'id');
      wx.showActionSheet({ itemList: ['启用', '停止预约 (用户可见)', '关闭 (用户不可见)', '删除'],
        success: async function(res) { switch(res.tapIndex) { case 0: await self._setStatus(self, meetId, 1); break; case 1: await self._setStatus(self, meetId, 9); break; case 2: await self._setStatus(self, meetId, 10); break; case 3: await self._del(self, meetId); break; } }
      });
    },
  }
});
