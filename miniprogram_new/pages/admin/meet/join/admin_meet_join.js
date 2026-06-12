const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const list = require('../../../../utils/list.js');
const cache = require('../../../../utils/cache.js');
const timeHelper = require('../../../../utils/time.js');
const admin = require('../../../../biz/admin.js');
const pageInit = require('../../../../utils/page_init.js');

const CACHE_CANCEL_REASON = 'JOIN_CANCEL_REASON';
const CACHE_REFUSE_REASON = 'JOIN_REFUSE_REASON';

Component({
  data: {
    isLoad: false, isAdmin: false, oprt: 'admin', isAllFold: true,
    meetId: '', mark: '', title: '', time: '',
    parentDayIdx: 0, parentTimeIdx: 0,
    dataList: null, sortMenus: [], sortItems: [], search: '', sortType: '',
    cancelModalShow: false, cancelAllModalShow: false, refuseModalShow: false,
    formReason: '', curIdx: -1,
  },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (options && options.meetId) {
        this._getSearchMenu();
        this.setData({
          meetId: options.meetId, mark: options.mark || '',
          parentDayIdx: options.dayidx || 0, parentTimeIdx: options.timeidx || 0,
          time: options.time || '',
          _params: { meetId: options.meetId, mark: options.mark || '' },
        }, function() { this.setData({ isLoad: true }); });
      }
      if (options && options.title) {
        var title = decodeURIComponent(options.title);
        this.setData({ title });
        wx.setNavigationBarTitle({ title: '分时段预约名单 - ' + title });
      }
    },

    url(e) { router.url(e, this); },

    bindCommListCmpt(e) {
      if (e.detail.search !== undefined) {
        this.setData({ search: '', sortType: '' });
      } else {
        var dl = e.detail.dataList;
        if (dl) { for (var k = 0; k < dl.list.length; k++) dl.list[k].fold = this.data.isAllFold; }
        this.setData({ dataList: dl });
        if (e.detail.sortType) this.setData({ sortType: e.detail.sortType });
      }
    },

    bindUnFoldTap(e) { var dl = this.data.dataList; dl.list[e.currentTarget.dataset.idx].fold = false; this.setData({ dataList: dl }); },
    bindFoldTap(e) { var dl = this.data.dataList; dl.list[e.currentTarget.dataset.idx].fold = true; this.setData({ dataList: dl }); },
    bindFoldAllTap() { var dl = this.data.dataList; for (var k = 0; k < dl.list.length; k++) dl.list[k].fold = true; this.setData({ isAllFold: true, dataList: dl }); },
    bindUnFoldAllTap() { var dl = this.data.dataList; for (var k = 0; k < dl.list.length; k++) dl.list[k].fold = false; this.setData({ isAllFold: false, dataList: dl }); },

    bindCopyTap(e) {
      var idx = e.currentTarget.dataset.idx;
      var item = this.data.dataList.list[idx];
      var forms = item.JOIN_FORMS || [];
      var ret = '项目：' + item.JOIN_MEET_TITLE + '\r时段：' + item.JOIN_MEET_DAY + ' ' + item.JOIN_MEET_TIME_START + '～' + item.JOIN_MEET_TIME_END + '\r';
      for (var k = 0; k < forms.length; k++) ret += forms[k].title + '：' + forms[k].val + '\r';
      wx.setClipboardData({ data: ret, success: function() { toast.showSuccToast('已复制到剪贴板'); } });
    },

    bindCancelTap(e) { this.setData({ formReason: cache.get(CACHE_CANCEL_REASON) || '', curIdx: e.currentTarget.dataset.idx, cancelModalShow: true }); },
    bindCancelAllTap() { this.setData({ formReason: '', cancelAllModalShow: true }); },
    bindClearReasonTap() { this.setData({ formReason: '' }); },

    bindCancelCmpt: function() {
      var self = this;
      cache.set(CACHE_CANCEL_REASON, self.data.formReason, 86400 * 365);
      self.bindStatusTap({ currentTarget: { dataset: { status: 99, idx: self.data.curIdx } } });
    },

    bindCancelAllCmpt: async function() {
      var self = this;
      try {
        var res = await cloud.callCloudSubmit(self.data.oprt + '/meet_cancel_time_join', {
          reason: self.data.formReason, meetId: self.data.meetId, timeMark: self.data.mark,
        }, { title: '预约记录取消中' });
        var pages = getCurrentPages();
        var parent = pages[pages.length - 2];
        if (parent) {
          var daysSet = parent.data.daysSet;
          if (daysSet && daysSet[self.data.parentDayIdx] && daysSet[self.data.parentDayIdx].times) {
            daysSet[self.data.parentDayIdx].times[self.data.parentTimeIdx].stat = res.data;
            parent.setData({ daysSet: daysSet });
          }
        }
        toast.showSuccToast('取消成功', 1500, function() {
          wx.redirectTo({ url: 'admin_meet_join?meetId=' + self.data.meetId + '&mark=' + self.data.mark + '&title=' + encodeURIComponent(self.data.title) + '&time=' + self.data.time + '&dayidx=' + self.data.parentDayIdx + '&timeidx=' + self.data.parentTimeIdx });
        });
      } catch (err) { console.error(err); }
    },

    bindRefuseTap(e) {
      this.setData({ formReason: cache.get(CACHE_REFUSE_REASON) || '', curIdx: e.currentTarget.dataset.idx, refuseModalShow: true });
    },

    bindRefuseCmpt: async function() {
      var self = this;
      cache.set(CACHE_REFUSE_REASON, self.data.formReason, 86400 * 365);
      self.bindStatusTap({ currentTarget: { dataset: { status: 8, idx: self.data.curIdx } } });
    },

    bindCheckinTap: function(e) {
      var self = this;
      var flag = Number(e.currentTarget.dataset.flag);
      var idx = Number(e.currentTarget.dataset.idx);
      var cb = async function() {
        var dl = self.data.dataList;
        try {
          await cloud.callCloudSubmit(self.data.oprt + '/join_checkin', { joinId: dl.list[idx]._id, flag: flag }, { title: '处理中' });
          var commList = self.selectComponent('#cmpt-comm-list');
          var sortIndex = commList ? commList.getSortIndex() : -1;
          if (sortIndex >= 10 && !self.data.search) {
            dl.list.splice(idx, 1); dl.total--;
          } else {
            dl.list[idx].JOIN_IS_CHECKIN = flag;
            if (flag === 1) dl.list[idx].JOIN_CHECKIN_TIME = timeHelper.time('Y-M-D h:m:s');
          }
          self.setData({ dataList: dl });
          toast.showSuccToast('操作成功');
        } catch (err) { console.error(err); }
      };
      if (flag === 1) toast.showConfirm('确认「核销」？', cb);
      else toast.showConfirm('确认「取消核销」？', cb);
    },

    bindStatusTap: async function(e) {
      var self = this;
      var status = Number(e.currentTarget.dataset.status);
      var oldStatus = Number(e.currentTarget.dataset.old);
      var idx = Number(e.currentTarget.dataset.idx);
      var dl = self.data.dataList;

      var cb = async function() {
        try {
          var res = await cloud.callCloudSubmit(self.data.oprt + '/join_status', {
            joinId: dl.list[idx]._id, status: status, reason: self.data.formReason,
          }, { title: '处理中' });
          var commList = self.selectComponent('#cmpt-comm-list');
          var sortIndex = commList ? commList.getSortIndex() : -1;
          if (sortIndex != -1 && sortIndex != 5 && !self.data.search) {
            dl.list.splice(idx, 1); dl.total--;
          } else {
            dl.list[idx].JOIN_REASON = self.data.formReason;
            dl.list[idx].JOIN_STATUS = status;
            if (status === 99 || status === 8) dl.list[idx].JOIN_IS_CHECKIN = 0;
          }
          self.setData({ cancelModalShow: false, refuseModalShow: false, formReason: '', curIdx: -1, dataList: dl });
          var pages = getCurrentPages();
          var parent = pages[pages.length - 2];
          if (parent) {
            var daysSet = parent.data.daysSet;
            if (daysSet && daysSet[self.data.parentDayIdx] && daysSet[self.data.parentDayIdx].times) {
              daysSet[self.data.parentDayIdx].times[self.data.parentTimeIdx].stat = res.data;
              parent.setData({ daysSet: daysSet });
            }
          }
          toast.showSuccToast('操作成功');
        } catch (err) { console.error(err); }
      };

      switch (status) {
        case 99: await cb(); break;
        case 8: await cb(); break;
        case 1: {
          if (oldStatus == 10) toast.showConfirm('确认变更为「预约成功」？', cb);
          else if (oldStatus == 99) toast.showConfirm('确认恢复为「预约成功」状态？', cb);
          else await cb();
          break;
        }
        default: await cb(); break;
      }
    },

    bindDelTap: function(e) {
      var self = this;
      var idx = Number(e.currentTarget.dataset.idx);
      var dl = self.data.dataList;
      toast.showConfirm('确认删除该预约记录？ 删除后用户将无法查询到本预约记录', async function() {
        try {
          var res = await cloud.callCloudSubmit(self.data.oprt + '/join_del', { joinId: dl.list[idx]._id }, { title: '删除中' });
          dl.list.splice(idx, 1); dl.total--;
          self.setData({ dataList: dl });
          var pages = getCurrentPages();
          var parent = pages[pages.length - 2];
          if (parent) {
            var daysSet = parent.data.daysSet;
            if (daysSet && daysSet[self.data.parentDayIdx] && daysSet[self.data.parentDayIdx].times) {
              daysSet[self.data.parentDayIdx].times[self.data.parentTimeIdx].stat = res.data;
              parent.setData({ daysSet: daysSet });
            }
          }
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