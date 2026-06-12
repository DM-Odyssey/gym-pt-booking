const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const data = require('../../../../utils/data.js');
const timeHelper = require('../../../../utils/time.js');
const dom = require('../../../../utils/dom.js');
const form = require('../../../../utils/form.js');
const wk = require('../../../../biz/work.js');
const adminMeet = require('../../../../biz/admin_meet.js');
const list = require('../../../../utils/list.js');

Component({
  data: {
    oprt: 'work', daysTimeOptions: adminMeet.getDaysTimeOptions(),
    multiDoDay: [], hasDays: [], lastHasDays: [], hasJoinDays: [], days: [],
    curIdx: -1, curTimesIdx: -1, curTimeLimitModalShow: false,
    curTimeIsLimit: false, curTimeLimit: 50,
    saveTempModalShow: false, formTempName: '',
    cancelModalShow: false, formReason: '', topShow: false,
  },
  methods: {
    onLoad() { if (!wk.isWork(this)) return; this._init(); },
    url(e) { router.url(e, this); },
    model(e) { form.model(this, e); },
    switchModel(e) { form.switchModel(this, e, 'bool'); },

    _init() {
      var parent = list.getPrevPage(2);
      if (!parent) return;
      var formDaysSet = parent.data.formDaysSet || [];
      var days = [], lastHasDays = [], hasJoinDays = [], now = timeHelper.time('Y-M-D');
      for (var k = 0; k < formDaysSet.length; k++) {
        if (formDaysSet[k].day < now) lastHasDays.push(formDaysSet[k]);
        else { days.push(formDaysSet[k]); if (this._checkHasJoinCnt(formDaysSet[k].times)) hasJoinDays.push(formDaysSet[k].day); }
      }
      this.setData({ hasDays: data.getArrByKey(lastHasDays, 'day'), lastHasDays: lastHasDays, hasJoinDays: hasJoinDays, days: days });
      this._syncCalData();
    },

    _checkHasJoinCnt(times) { if (!times) return false; for (var k = 0; k < times.length; k++) { if (times[k].stat.succCnt) return true; } return false; },
    _syncCalData() { this.setData({ multiDoDay: data.getArrByKey(this.data.days, 'day') }); },
    _setHasJoinDays() { var days = this.data.days, has = []; for (var k = 0; k < days.length; k++) { if (this._checkHasJoinCnt(days[k].times)) has.push(days[k].day); } this.setData({ hasJoinDays: has }); },

    bindTimeAddTap(e) { var idx = dom.dataset(e, 'idx'), days = this.data.days; if (days[idx].times.length >= 20) return toast.showModal('最多可以添加20个时段'); days[idx].times.push(adminMeet.getNewTimeNode(days[idx].day)); this.setData({ days: days }); },
    bindTimeDelTap(e) {
      var idx = dom.dataset(e, 'idx'), timesIdx = dom.dataset(e, 'timesidx'), days = this.data.days, node = days[idx].times[timesIdx];
      var s = this;
      if (node.stat.succCnt) { toast.showConfirm('该时段已有' + node.stat.succCnt + '人预约，删除将取消所有预约！', function() { s.setData({ formReason: '', curIdx: idx, curTimesIdx: timesIdx, cancelModalShow: true }); }); }
      else { toast.showConfirm('是否要删除该时间段？', function() { days[idx].times.splice(timesIdx, 1); s.setData({ days: days }); }); }
    },
    bindTimeStatusSwitch(e) {
      var idx = dom.dataset(e, 'idx'), timesIdx = dom.dataset(e, 'timesidx'), days = this.data.days, status = days[idx].times[timesIdx].status;
      if (status == 0) { days[idx].times[timesIdx].status = 1; this.setData({ days: days }); }
      else { var s = this; toast.showConfirm('是否要停止该时间段的预约？', function() { days[idx].times[timesIdx].status = 0; s.setData({ days: days }); }); }
    },
    bindDaysTimeStartCmpt(e) { var start = e.detail.join(':'), idx = dom.dataset(e, 'idx'), timesIdx = dom.dataset(e, 'timesidx'), days = this.data.days, end = days[idx].times[timesIdx].end; if (start >= end) return toast.showModal('开始时间不能大于等于结束时间'); days[idx].times[timesIdx].start = start; this.setData({ days: days }); },
    bindDaysTimeEndCmpt(e) { var end = e.detail.join(':'), idx = dom.dataset(e, 'idx'), timesIdx = dom.dataset(e, 'timesidx'), days = this.data.days, start = days[idx].times[timesIdx].start; if (start >= end) return toast.showModal('开始时间不能大于等于结束时间'); days[idx].times[timesIdx].end = end; this.setData({ days: days }); },

    bindDataCalendarClickCmpt(e) {
      var clickDays = e.detail.days; if (!clickDays) return;
      var days = this.data.days, retDays = [];
      for (var k = 0; k < clickDays.length; k++) {
        var dayExist = false;
        for (var j in days) { if (days[j].day == clickDays[k]) { retDays.push(days[j]); dayExist = true; break; } }
        if (!dayExist) {
          var dayDesc = timeHelper.fmtDateCHN(clickDays[k]) + ' (' + timeHelper.week(clickDays[k]) + ')';
          var dayNode = [{mark:'mark-am',start:'09:00',end:'11:59',limit:30,isLimit:true,status:1,stat:{succCnt:0,cancelCnt:0,adminCancelCnt:0}},{mark:'mark-pm',start:'14:00',end:'17:59',limit:50,isLimit:true,status:1,stat:{succCnt:0,cancelCnt:0,adminCancelCnt:0}}];
          var times = []; for (var n = 0; n < dayNode.length; n++) { times.push(adminMeet.getNewTimeNode(clickDays[k], dayNode[n])); }
          retDays.push({ day: clickDays[k], dayDesc: dayDesc, times: times });
        }
      }
      this.setData({ days: retDays });
    },

    bindShowTimeLimitModalTap(e) {
      var curIdx = dom.dataset(e, 'idx'), curTimesIdx = dom.dataset(e, 'timesidx'), days = this.data.days;
      if (curTimesIdx == -1) { this.setData({ curIdx: curIdx, curTimesIdx: -1, curTimeIsLimit: false, curTimeLimit: 50, curTimeLimitModalShow: true }); }
      else { var node = days[curIdx].times[curTimesIdx]; this.setData({ curIdx: curIdx, curTimesIdx: curTimesIdx, curTimeIsLimit: node.isLimit, curTimeLimit: node.limit, curTimeLimitModalShow: true }); }
    },
    bindTimeLimitSetCmpt() {
      var days = this.data.days, idx = this.data.curIdx, timesIdx = this.data.curTimesIdx;
      if (timesIdx == -1) { for (var k = 0; k < days[idx].times.length; k++) { days[idx].times[k].isLimit = this.data.curTimeIsLimit; days[idx].times[k].limit = this.data.curTimeLimit; } }
      else { days[idx].times[timesIdx].isLimit = this.data.curTimeIsLimit; days[idx].times[timesIdx].limit = this.data.curTimeLimit; }
      this.setData({ days: days, curTimeLimitModalShow: false });
    },

    bindSaveTap() {
      var parent = list.getPrevPage(2); if (!parent) { toast.showNoneToast('前序页面不存在'); return; }
      var days = this.data.days, getDays = [];
      for (var k = 0; k < days.length; k++) { if (days[k].times.length > 0) getDays.push(days[k]); }
      parent.setData({ formDaysSet: this.data.lastHasDays.concat(getDays) });
      wx.navigateBack();
    },

    bindDaySetTap(e) {
      var s = this;
      wx.showActionSheet({ itemList: ['选用模板配置', '保存为模板', '删除该日期', '复制到所有日期'],
        success: function(res) {
          if (res.tapIndex == 0) { s._selectTemp(e); }
          if (res.tapIndex == 1) { s._saveTempModal(e); }
          if (res.tapIndex == 2) { var curIdx = dom.dataset(e, 'idx'); if (s._checkHasJoinCnt(s.data.days[curIdx].times)) return toast.showModal('该日已有用户预约，不能直接删除'); toast.showConfirm('确认删除该日期吗?', function() { s.data.days.splice(curIdx, 1); s.setData({ days: s.data.days }); s._syncCalData(); }); }
          if (res.tapIndex == 3) { s._copyDaySetToAll(e); }
        }
      });
    },
    _selectTemp(e) { var curIdx = dom.dataset(e, 'idx'); if (this._checkHasJoinCnt(this.data.days[curIdx].times)) return toast.showModal('该日已有用户预约，不能选用模板'); this.setData({ curIdx: curIdx }); wx.navigateTo({ url: '/pages/admin/meet/temp/admin_meet_temp?source=time' }); },
    _saveTempModal(e) { var curIdx = dom.dataset(e, 'idx'), days = this.data.days; if (days[curIdx].times.length <= 0) return toast.showModal('该日期下没有设置时段'); this.setData({ saveTempModalShow: true, curIdx: curIdx }); },
    _copyDaySetToAll(e) {
      var curIdx = dom.dataset(e, 'idx'), days = this.data.days, day = days[curIdx].day, temps = days[curIdx].times, s = this;
      toast.showConfirm('确认将「' + day + '」下的时段设置复制到其他日期下吗? (原有时段将被清除)', function() {
        for (var k = 0; k < days.length; k++) { if (s._checkHasJoinCnt(days[k].times)) continue; var times = []; for (var j in temps) { var node = adminMeet.getNewTimeNode(days[k].day); node.start = temps[j].start; node.end = temps[j].end; node.limit = temps[j].limit; node.isLimit = temps[j].isLimit; times.push(node); } days[k].times = times; }
        s.setData({ days: days });
      });
    },

    bindCancelMeetJoinCmpt: async function() {
      var s = this, curIdx = s.data.curIdx, curTimesIdx = s.data.curTimesIdx, days = s.data.days;
      var parent = list.getPrevPage(2); if (!parent) return;
      try { await cloud.callCloudSubmit(s.data.oprt + '/meet_cancel_time_join', { reason: s.data.formReason, meetId: parent.data.id, timeMark: days[curIdx].times[curTimesIdx].mark }, { title: '预约记录取消中' }); days[curIdx].times.splice(curTimesIdx, 1); s.setData({ days: days, cancelModalShow: false, formReason: '' }); s._setHasJoinDays(); toast.showSuccToast('取消成功'); } catch(err) { console.error(err); }
    },
    bindClearReasonTap() { this.setData({ formReason: '' }); },
    bindSaveTempCmpt: async function() {
      var s = this, name = s.data.formTempName; if (name.length <= 0) return toast.showNoneToast('请填写模板名称'); if (name.length > 20) return toast.showNoneToast('模板名称不能超过20个字');
      var days = s.data.days, times = days[s.data.curIdx].times; if (times.length <= 0) return toast.showNoneToast('至少需要包含一个时段');
      var temps = []; for (var k = 0; k < times.length; k++) { temps.push({ start: times[k].start, end: times[k].end, isLimit: times[k].isLimit, limit: times[k].limit }); }
      try { await cloud.callCloudSubmit(s.data.oprt + '/meet_temp_insert', { name: name, times: temps }, { title: '模板保存中' }); toast.showSuccToast('保存成功'); s.setData({ saveTempModalShow: false, formTempName: '' }); } catch(err) { console.error(err); }
    },

    onPageScroll(e) { this.setData({ topShow: e.scrollTop > 100 }); },
    bindTopTap() { wx.pageScrollTo({ scrollTop: 0 }); },
  }
});
