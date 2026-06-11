const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const toast = require('../../../utils/toast.js');
const list = require('../../../utils/list.js');
const cache = require('../../../utils/cache.js');
const timeHelper = require('../../../utils/time.js');
const work = require('../../../biz/work.js');

Component({
  data: { isLoad: false, isWork: false, oprt: 'work', isAllFold: true,
    meetId: '', mark: '', title: '', time: '', parentDayIdx: 0, parentTimeIdx: 0,
    dataList: null, sortMenus: [], sortItems: [], search: '',
    cancelModalShow: false, cancelAllModalShow: false, formReason: '', curIdx: -1,
  },
  methods: {
    onLoad(options) {
      if (!work.isWork(this)) return;
      if (options && options.meetId) {
        this.setData({ meetId: options.meetId, mark: options.mark || '', time: options.time || '', isLoad: true,
          _params: { meetId: options.meetId, mark: options.mark || '' } });
        this._getSearchMenu();
      }
      if (options && options.title) { wx.setNavigationBarTitle({ title: '预约名单 - ' + decodeURIComponent(options.title) }); }
    },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { if (e.detail.search) { this.setData({ search: '', sortType: '' }); return; } var dl = e.detail.dataList; if (dl) { for (var k = 0; k < dl.list.length; k++) dl.list[k].fold = this.data.isAllFold; } this.setData({ dataList: dl }); },
    bindUnFoldTap(e) { var dl = this.data.dataList; dl.list[e.currentTarget.dataset.idx].fold = false; this.setData({ dataList: dl }); },
    bindFoldTap(e) { var dl = this.data.dataList; dl.list[e.currentTarget.dataset.idx].fold = true; this.setData({ dataList: dl }); },
    bindFoldAllTap() { var dl = this.data.dataList; for (var k = 0; k < dl.list.length; k++) dl.list[k].fold = true; this.setData({ isAllFold: true, dataList: dl }); },
    bindUnFoldAllTap() { var dl = this.data.dataList; for (var k = 0; k < dl.list.length; k++) dl.list[k].fold = false; this.setData({ isAllFold: false, dataList: dl }); },
    bindCopyTap(e) { var idx = e.currentTarget.dataset.idx; var item = this.data.dataList.list[idx]; var ret = '项目：' + item.JOIN_MEET_TITLE + '\r时段：' + item.JOIN_MEET_DAY + ' ' + item.JOIN_MEET_TIME_START + '～' + item.JOIN_MEET_TIME_END + '\r'; (item.JOIN_FORMS || []).forEach(function(f) { ret += f.title + '：' + f.val + '\r'; }); wx.setClipboardData({ data: ret, success: function() { toast.showSuccToast('已复制到剪贴板'); } }); },
    bindCancelTap(e) { this.setData({ formReason: cache.get('JOIN_CANCEL_REASON') || '', curIdx: e.currentTarget.dataset.idx, cancelModalShow: true }); },
    bindCancelAllTap() { this.setData({ formReason: '', cancelAllModalShow: true }); },
    bindClearReasonTap() { this.setData({ formReason: '' }); },

    bindCancelCmpt: function() { var s=this; cache.set('JOIN_CANCEL_REASON', s.data.formReason); s.bindStatusTap({currentTarget:{dataset:{status:99,idx:s.data.curIdx}}}); },
    bindCancelAllCmpt: async function() { var s=this; try { await cloud.callCloudSubmit('work/meet_cancel_time_join',{reason:s.data.formReason,meetId:s.data.meetId,timeMark:s.data.mark},{title:'处理中'}); toast.showSuccToast('取消成功',1500,function(){wx.redirectTo({url:'work_meet_join?meetId='+s.data.meetId+'&mark='+s.data.mark+'&time='+s.data.time});}); } catch(err){console.error(err);} },

    bindCheckinTap: function(e) { var s=this; var flag=Number(e.currentTarget.dataset.flag); var idx=Number(e.currentTarget.dataset.idx); toast.showConfirm(flag===1?'确认核销？':'确认取消核销？',async function(){var dl=s.data.dataList;try{await cloud.callCloudSubmit('work/join_checkin',{joinId:dl.list[idx]._id,flag:flag},{title:'处理中'});dl.list[idx].JOIN_IS_CHECKIN=flag;if(flag===1)dl.list[idx].JOIN_CHECKIN_TIME=timeHelper.time('Y-M-D h:m:s');s.setData({dataList:dl});toast.showSuccToast('操作成功');}catch(err){console.error(err);}}); },
    bindStatusTap: async function(e) { var s=this; var status=Number(e.currentTarget.dataset.status); var idx=Number(e.currentTarget.dataset.idx); var dl=s.data.dataList; try{await cloud.callCloudSubmit('work/join_status',{joinId:dl.list[idx]._id,status:status,reason:s.data.formReason},{title:'处理中'});dl.list[idx].JOIN_STATUS=status;dl.list[idx].JOIN_REASON=s.data.formReason;if(status===99)dl.list[idx].JOIN_IS_CHECKIN=0;s.setData({cancelModalShow:false,formReason:'',curIdx:-1,dataList:dl});toast.showSuccToast('操作成功');}catch(err){console.error(err);} },
    bindDelTap: function(e) { var s=this; var idx=Number(e.currentTarget.dataset.idx); var dl=s.data.dataList; toast.showConfirm('确认删除？',async function(){try{await cloud.callCloudSubmit('work/join_del',{joinId:dl.list[idx]._id},{title:'删除中'});dl.list.splice(idx,1);dl.total--;s.setData({dataList:dl});toast.showSuccToast('删除成功');}catch(err){console.error(err);}}); },

    _getSearchMenu() { this.setData({ sortMenus: [{label:'全部',type:'',value:''},{label:'成功',type:'status',value:1},{label:'已取消',type:'status',value:1099},{label:'已核销',type:'checkin',value:1},{label:'未核销',type:'checkin',value:0}], sortItems:[] }); },
  }
});
