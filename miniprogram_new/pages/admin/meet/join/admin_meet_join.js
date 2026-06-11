const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const list = require('../../../../utils/list.js');
const cache = require('../../../../utils/cache.js');
const timeHelper = require('../../../../utils/time.js');
const admin = require('../../../../biz/admin.js');
const pageInit = require('../../../../utils/page_init.js');

Component({
  data: {
    isLoad: false, isAdmin: false, oprt: 'admin', isAllFold: true,
    meetId: '', mark: '', title: '', time: '',
    parentDayIdx: 0, parentTimeIdx: 0,
    dataList: null, sortMenus: [], sortItems: [], search: '',
    cancelModalShow: false, cancelAllModalShow: false, refuseModalShow: false,
    formReason: '', curIdx: -1,
  },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (options && options.meetId) {
        this.setData({
          meetId: options.meetId, mark: options.mark || '',
          parentDayIdx: options.dayidx || 0, parentTimeIdx: options.timeidx || 0,
          time: options.time || '', isLoad: true,
          _params: { meetId: options.meetId, mark: options.mark || '' },
        });
        this._getSearchMenu();
      }
      if (options && options.title) {
        const title = decodeURIComponent(options.title);
        this.setData({ title });
        wx.setNavigationBarTitle({ title: '分时段预约名单 - ' + title });
      }
    },

    url(e) { router.url(e, this); },

    bindCommListCmpt(e) {
      if (e.detail.search) { this.setData({ search: '', sortType: '' }); return; }
      const dl = e.detail.dataList;
      if (dl) { for (let k = 0; k < dl.list.length; k++) dl.list[k].fold = this.data.isAllFold; }
      this.setData({ dataList: dl });
    },

    bindUnFoldTap(e) { const dl = this.data.dataList; dl.list[e.currentTarget.dataset.idx].fold = false; this.setData({ dataList: dl }); },
    bindFoldTap(e) { const dl = this.data.dataList; dl.list[e.currentTarget.dataset.idx].fold = true; this.setData({ dataList: dl }); },
    bindFoldAllTap() { const dl = this.data.dataList; for (let k = 0; k < dl.list.length; k++) dl.list[k].fold = true; this.setData({ isAllFold: true, dataList: dl }); },
    bindUnFoldAllTap() { const dl = this.data.dataList; for (let k = 0; k < dl.list.length; k++) dl.list[k].fold = false; this.setData({ isAllFold: false, dataList: dl }); },

    bindCopyTap(e) {
      const idx = e.currentTarget.dataset.idx;
      const item = this.data.dataList.list[idx];
      let ret = '项目：' + item.JOIN_MEET_TITLE + '\r时段：' + item.JOIN_MEET_DAY + ' ' + item.JOIN_MEET_TIME_START + '～' + item.JOIN_MEET_TIME_END + '\r';
      (item.JOIN_FORMS || []).forEach(function(f) { ret += f.title + '：' + f.val + '\r'; });
      wx.setClipboardData({ data: ret, success: function() { toast.showSuccToast('已复制到剪贴板'); } });
    },

    bindCancelTap(e) { this.setData({ formReason: cache.get('JOIN_CANCEL_REASON') || '', curIdx: e.currentTarget.dataset.idx, cancelModalShow: true }); },
    bindCancelAllTap() { this.setData({ formReason: '', cancelAllModalShow: true }); },
    bindClearReasonTap() { this.setData({ formReason: '' }); },

    bindCancelCmpt: function() {
      var self = this;
      cache.set('JOIN_CANCEL_REASON', self.data.formReason, 86400 * 365);
      self.bindStatusTap({ currentTarget: { dataset: { status: 99, idx: self.data.curIdx } } });
    },

    bindCancelAllCmpt: async function() {
      var self = this;
      try {
        await cloud.callCloudSubmit(self.data.oprt + '/meet_cancel_time_join', {
          reason: self.data.formReason, meetId: self.data.meetId, timeMark: self.data.mark,
        }, { title: '预约记录取消中' });
        toast.showSuccToast('取消成功', 1500, function() {
          wx.redirectTo({ url: 'admin_meet_join?meetId=' + self.data.meetId + '&mark=' + self.data.mark + '&title=' + encodeURIComponent(self.data.title) + '&time=' + self.data.time + '&dayidx=' + self.data.parentDayIdx + '&timeidx=' + self.data.parentTimeIdx });
        });
      } catch (err) { console.error(err); }
    },

    bindCheckinTap: function(e) {
      var self = this;
      var flag = Number(e.currentTarget.dataset.flag);
      var idx = Number(e.currentTarget.dataset.idx);
      toast.showConfirm(flag === 1 ? '确认「核销」？' : '确认「取消核销」？', async function() {
        var dl = self.data.dataList;
        try {
          await cloud.callCloudSubmit(self.data.oprt + '/join_checkin', { joinId: dl.list[idx]._id, flag: flag }, { title: '处理中' });
          dl.list[idx].JOIN_IS_CHECKIN = flag;
          if (flag === 1) dl.list[idx].JOIN_CHECKIN_TIME = timeHelper.time('Y-M-D h:m:s');
          self.setData({ dataList: dl });
          toast.showSuccToast('操作成功');
        } catch (err) { console.error(err); }
      });
    },

    bindStatusTap: async function(e) {
      var self = this;
      var status = Number(e.currentTarget.dataset.status);
      var idx = Number(e.currentTarget.dataset.idx);
      var dl = self.data.dataList;
      try {
        var res = await cloud.callCloudSubmit(self.data.oprt + '/join_status', {
          joinId: dl.list[idx]._id, status: status, reason: self.data.formReason,
        }, { title: '处理中' });
        dl.list[idx].JOIN_STATUS = status;
        dl.list[idx].JOIN_REASON = self.data.formReason;
        if (status === 99) dl.list[idx].JOIN_IS_CHECKIN = 0;
        self.setData({ cancelModalShow: false, refuseModalShow: false, formReason: '', curIdx: -1, dataList: dl });
        toast.showSuccToast('操作成功');
      } catch (err) { console.error(err); }
    },

    bindDelTap: function(e) {
      var self = this;
      var idx = Number(e.currentTarget.dataset.idx);
      var dl = self.data.dataList;
      toast.showConfirm('确认删除该预约记录？', async function() {
        try {
          await cloud.callCloudSubmit(self.data.oprt + '/join_del', { joinId: dl.list[idx]._id }, { title: '删除中' });
          dl.list.splice(idx, 1); dl.total--;
          self.setData({ dataList: dl });
          toast.showSuccToast('删除成功');
        } catch (err) { console.error(err); }
      });
    },

    _getSearchMenu: function() {
      this.setData({
        sortMenus: [
          { label: '全部', type: '', value: '' },
          { label: '成功', type: 'status', value: 1 },
          { label: '已取消', type: 'status', value: 1099 },
          { label: '已核销', type: 'checkin', value: 1 },
          { label: '未核销', type: 'checkin', value: 0 },
        ],
        sortItems: [],
      });
    },
  }
});
