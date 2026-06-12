const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const timeHelper = require('../../../../utils/time.js');
const admin = require('../../../../biz/admin.js');
const pageInit = require('../../../../utils/page_init.js');

function openDoc(name, url, ext) {
  ext = ext || '.xlsx';
  wx.showLoading({ title: '文件下载中' });
  wx.downloadFile({
    url: url,
    filePath: wx.env.USER_DATA_PATH + '/' + name + timeHelper.time('YMDhms') + ext,
    success: function(res) {
      wx.hideLoading();
      if (res.statusCode != 200) return toast.showModal('打开文件失败，请重试或者采取别的下载方式');
      wx.openDocument({ showMenu: true, filePath: res.filePath, success: function() { console.log('打开文档成功'); } });
    },
    fail: function(err) {
      wx.hideLoading();
      console.log(err);
      toast.showModal('打开文件失败，请重试或者采取别的下载方式');
    }
  });
}

Component({
  data: { isLoad: false, title: '', url: '', time: '', startDay: timeHelper.time('Y-M-D'), endDay: timeHelper.time('Y-M-D'), status: 1 },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options, 'meetId')) return;
      if (options && options.title) this.setData({ title: decodeURIComponent(options.title) });
      this._loadDetail(1);
    },
    async _loadDetail(isDel) {
      if (!admin.isAdmin(this)) return;
      const data = await cloud.callCloudData('admin/join_data_get', { isDel }, { title: 'bar' });
      if (!data) return;
      this.setData({ isLoad: true, url: data.url, time: data.time });
    },
    url(e) { router.url(e, this); },
    bindOpenTap() { openDoc('预约名单', this.data.url); },
    async bindExportTap() {
      try {
        const params = { meetId: this.data.meetId, startDay: this.data.startDay, endDay: this.data.endDay, status: this.data.status };
        const res = await cloud.callCloudSubmit('admin/join_data_export', params, { title: '数据生成中' });
        this._loadDetail(0);
        var total = (res.data && res.data.total != null) ? res.data.total : '?';
        toast.showModal('数据文件生成成功(' + total + '条记录), 请点击「直接打开」按钮或者复制文件地址下载');
      } catch (err) {
        console.log(err);
        toast.showNoneToast('导出失败，请重试');
      }
    },
    async bindDelTap() {
      try {
        await cloud.callCloudSubmit('admin/join_data_del', {}, { title: '数据删除中' });
        this.setData({ url: '', time: '' });
        toast.showSuccToast('删除成功');
      } catch (err) { console.log(err); toast.showNoneToast('删除失败，请重试'); }
    },
    onPullDownRefresh() { this._loadDetail(1).then(function() { wx.stopPullDownRefresh(); }); },
  }
});