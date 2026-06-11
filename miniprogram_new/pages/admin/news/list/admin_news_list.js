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
    bindStatusMoreTap(e) {
      const id = e.currentTarget.dataset.id;
      wx.showActionSheet({ itemList: ['设为停用', '设为正常', '首页推荐', '取消推荐', '编辑排序号'],
        success: (res) => {
          const actions = ['admin/news_status', 'admin/news_status', 'admin/news_vouch', 'admin/news_vouch', 'admin/news_sort'];
          const idx = res.tapIndex;
          if (idx === 4) { // sort
            wx.showModal({ title: '设置排序号', editable: true, placeholderText: '数字越小越靠前',
              success: (r) => { if(r.confirm) cloud.callCloudSubmit('admin/news_sort', { id, sort: r.content }).then(() => toast.showSuccToast('操作成功')); }
            });
            return;
          }
          let status = idx === 0 ? 0 : (idx === 1 ? 1 : (idx === 2 ? 1 : 0));
          let route = idx < 2 ? 'admin/news_status' : 'admin/news_vouch';
          if (route === 'admin/news_vouch') status = idx === 2 ? 1 : 0;
          cloud.callCloudSubmit(route, { id, status }).then(() => toast.showSuccToast('操作成功'));
        }
      });
    },
    onShareAppMessage() {},
  }
});
