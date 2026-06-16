const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../services/admin.js');
const adminMeet = require('../../../../services/admin_meet.js');
const list = require('../../../../utils/list.js');
const dom = require('../../../../utils/dom.js');

Component({
  data: {
    oprt: 'admin', isLoad: false, temps: [],
    curIdx: -1, curTimeModalShow: false, curTimeIsLimit: false, curTimeLimit: 50,
  },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this._loadList(); },
    url(e) { router.url(e, this); },
    switchModel(e) { const item = e.currentTarget.dataset.item; this.setData({ [item]: e.detail.value }); },

    async _loadList() {
      try {
        const res = await cloud.callCloudSubmit(this.data.oprt + '/meet_temp_list', {}, { title: 'bar' });
        this.setData({ isLoad: (res.data && res.data.length === 0) ? null : true, temps: res.data });
      } catch (err) { console.error(err); }
    },

    bindSelectTap(e) {
      const curIdx = dom.dataset(e, 'idx');
      const temps = this.data.temps[curIdx].TEMP_TIMES;
      const name = this.data.temps[curIdx].TEMP_NAME;
      const parent = list.getPrevPage(2);
      if (!parent) return;
      const days = parent.data.days;
      const day = days[parent.data.curIdx].day;

      const cb = () => {
        const times = [];
        for (let k = 0; k < temps.length; k++) {
          const node = adminMeet.getNewTimeNode(day);
          node.start = temps[k].start;
          node.end = temps[k].end;
          node.limit = temps[k].limit;
          node.isLimit = temps[k].isLimit;
          times.push(node);
        }
        days[parent.data.curIdx].times = times;
        parent.setData({ days });
        wx.navigateBack();
      };
      toast.showConfirm('确认要选用模板「' + name + '」配置到日期「' + day + '」下吗?', cb);
    },

    bindOprtTap(e) {
      const curIdx = dom.dataset(e, 'idx');
      const self = this;
      wx.showActionSheet({
        itemList: ['删除模板', '批量设置人数上限'],
        success(res) {
          if (res.tapIndex === 0) {
            const temps = self.data.temps;
            const name = temps[curIdx].TEMP_NAME;
            toast.showConfirm('确认要删除模板「' + name + '」吗?', () => self._delTemp(curIdx, temps[curIdx]._id));
          }
          if (res.tapIndex === 1) {
            self.setData({ curIdx, curTimeModalShow: true });
          }
        }
      });
    },

    async _delTemp(curIdx, id) {
      try {
        await cloud.callCloudSubmit(this.data.oprt + '/meet_temp_del', { id }, { title: '删除中' });
        const temps = this.data.temps;
        temps.splice(curIdx, 1);
        this.setData({ temps, isLoad: temps.length === 0 ? null : true });
      } catch (err) { console.error(err); }
    },

    bindAllLimitSetCmpt() {
      if (this.data.curIdx <= -1) return;
      const temp = this.data.temps[this.data.curIdx];
      const self = this;
      cloud.callCloudSubmit(self.data.oprt + '/meet_temp_edit', {
        id: temp._id, limit: self.data.curTimeLimit, isLimit: self.data.curTimeIsLimit,
      }, { title: '批量修改中' }).then((res) => {
        self.setData({ temps: res.data, curTimeModalShow: false, curTimeIsLimit: false, curTimeLimit: 50 });
        toast.showSuccToast('修改成功');
      }).catch(err => console.error(err));
    },

    onPullDownRefresh() { this._loadList().then(() => wx.stopPullDownRefresh()); },
  }
});
