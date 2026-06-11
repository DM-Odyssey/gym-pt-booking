const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');

Component({ data: { isLoad: false, url: '', time: '', condition: '' },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (options && options.condition) this.setData({ condition: options.condition });
      this._loadDetail(1);
    },
    async _loadDetail(isDel) {
      const data = await cloud.callCloudData('admin/user_data_get', { isDel }, { title: 'bar' });
      if (data) this.setData({ isLoad: true, url: data.url || '', time: data.time || '' });
    },
    url(e) { router.url(e, this); },
    async bindExportTap() {
      try {
        const res = await cloud.callCloudData('admin/user_data_export', { condition: this.data.condition, fields: [] }, { title: '数据生成中' });
        this._loadDetail(0);
        toast.showModal('数据文件生成成功(' + (res.total||0) + '条记录)，请复制链接下载');
      } catch (err) { toast.showNoneToast('导出失败，请重试'); }
    },
    async bindDelTap() {
      try {
        await cloud.callCloudData('admin/user_data_del', {}, { title: '数据删除中' });
        this.setData({ url: '', time: '' });
        toast.showSuccToast('删除成功');
      } catch (err) { toast.showNoneToast('删除失败'); }
    },
    onPullDownRefresh() { this._loadDetail(1).then(() => wx.stopPullDownRefresh()); },
  }
});
