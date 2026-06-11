const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const toast = require('../../../utils/toast.js');
const work = require('../../../biz/work.js');

Component({ data: { isLoad: true, oprt: 'work', meetId: '' },
  methods: {
    onLoad(options) { if (!work.isWork(this)) return; if (options && options.meetId) this.setData({ meetId: options.meetId }); },
    url(e) { router.url(e, this); },
    bindScanTap() { var s=this; wx.scanCode({ success: async function(res) { if(!res||!res.result||!res.result.includes('meet=')||res.result.length!==20){toast.showModal('错误的预约码');return;} try{await cloud.callCloudSubmit('work/join_scan',{meetId:s.data.meetId,code:res.result.replace('meet=','')},{title:'核销中'});toast.showModal('核销成功');}catch(err){console.error(err);} }, fail: function(err) { if(err&&err.errMsg==='scanCode:fail')toast.showModal('扫码错误'); } }); },
  }
});
