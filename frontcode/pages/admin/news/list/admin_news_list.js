const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const list = require('../../../../utils/list.js');
const dom = require('../../../../utils/dom.js');
const admin = require('../../../../services/admin.js');
const common = require('../../../../services/common.js');

Component({
  data: { isLoad: false, NEWS_NAME: '公告', cateIdOptions: [], dataList: null, sortMenus: [], sortItems: [], search: '' },
  methods: {
    onLoad() {
      if (!admin.isAdmin(this)) return;
      wx.setNavigationBarTitle({ title: '公告-管理' });
      this.setData({ NEWS_NAME: '公告' });
      this._getSearchMenu();
    },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { list.commListListener(this, e); },

    _getSearchMenu() {
      var cateIdOptions = common.getCateList([]);
      var sortItem1 = [{ label: '分类', type: '', value: 0 }];
      sortItem1 = sortItem1.concat(common.getCateList([]));
      this.setData({
        search: '', cateIdOptions: cateIdOptions, sortItems: [sortItem1],
        sortMenus: [
          { label: '全部', type: '', value: '' }, { label: '正常', type: 'status', value: 1 },
          { label: '停用', type: 'status', value: 0 }, { label: '最新', type: 'sort', value: 'new' },
          { label: '首页推荐', type: 'vouch', value: 'vouch' }, { label: '置顶', type: 'top', value: 'top' },
        ], isLoad: true,
      });
    },

    _setSort: async function(e) { var id = e.currentTarget.dataset.id; var sort = e.currentTarget.dataset.sort; if (!id) return;
      try { await cloud.callCloudSubmit('admin/news_sort', { id: id, sort: sort }); list.modifyListNode(id, this.data.dataList.list, 'NEWS_ORDER', sort); this.setData({ dataList: this.data.dataList }); toast.showSuccToast('设置成功'); } catch(err) { console.error(err); } },
    _setVouch: async function(e) { var id = dom.dataset(e, 'id'); var vouch = dom.dataset(e, 'vouch'); if (!id) return;
      try { await cloud.callCloudSubmit('admin/news_vouch', { id: id, vouch: vouch }); list.modifyListNode(id, this.data.dataList.list, 'NEWS_VOUCH', vouch); this.setData({ dataList: this.data.dataList }); toast.showSuccToast('设置成功'); } catch(err) { console.error(err); } },
    _setStatus: async function(e) { var id = dom.dataset(e, 'id'); var status = Number(dom.dataset(e, 'status'));
      try { await cloud.callCloudSubmit('admin/news_status', { id: id, status: status }); list.modifyListNode(id, this.data.dataList.list, 'NEWS_STATUS', status, '_id'); this.setData({ dataList: this.data.dataList }); toast.showSuccToast('设置成功'); } catch(err) { console.error(err); } },
    _del: async function(e) { var id = dom.dataset(e, 'id');
      toast.showConfirm('确认删除？删除不可恢复', async function() { try { await cloud.callCloudSubmit('admin/news_del', { id: id }, { title: '删除中' }); list.delListNode(id, this.data.dataList.list, '_id'); this.data.dataList.total--; this.setData({ dataList: this.data.dataList }); toast.showSuccToast('删除成功'); } catch(err) { console.error(err); } }.bind(this)); },

    bindMoreTap: async function(e) {
      var self = this; var idx = dom.dataset(e, 'idx');
      var order = self.data.dataList.list[idx].NEWS_ORDER; var orderDesc = (order == 0) ? '取消置顶' : '置顶';
      var vouch = self.data.dataList.list[idx].NEWS_VOUCH; var vouchDesc = (vouch == 0) ? '推荐到首页' : '取消首页推荐';
      wx.showActionSheet({ itemList: ['预览', orderDesc, vouchDesc, '生成专属二维码'],
        success: async function(res) {
          switch(res.tapIndex) {
            case 0: var id = dom.dataset(e, 'id'); wx.navigateTo({ url: '/pages/news/detail/news_detail?id=' + id }); break;
            case 1: var s = (order == 0) ? 9999 : 0; e.currentTarget.dataset['sort'] = s; await self._setSort(e); break;
            case 2: vouch = (vouch == 0) ? 1 : 0; e.currentTarget.dataset['vouch'] = vouch; await self._setVouch(e); break;
            case 3: var qrVal = dom.dataset(e, 'qr'); var title = encodeURIComponent(dom.dataset(e, 'title')); if (qrVal) { wx.navigateTo({ url: '/pages/admin/setup/qrcode/admin_setup_qrcode?title=' + title + '&qr=' + encodeURIComponent(qrVal) }); } else { wx.navigateTo({ url: '/pages/admin/setup/qrcode/admin_setup_qrcode?title=' + title }); } break;
          }
        }
      });
    },

    bindStatusMoreTap: async function(e) {
      var self = this;
      wx.showActionSheet({ itemList: ['启用', '停用 (不可见)', '删除'],
        success: async function(res) {
          switch(res.tapIndex) { case 0: e.currentTarget.dataset['status'] = 1; await self._setStatus(e); break; case 1: e.currentTarget.dataset['status'] = 0; await self._setStatus(e); break; case 2: await self._del(e); break; }
        }
      });
    },
  }
});
