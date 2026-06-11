const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const work = require('../../../../biz/work.js');

Component({ data: { isLoad: false, oprt: 'work', meetId: '' },
  methods: {
    onLoad(options) {
      if (!work.isWork(this)) return;
      if (options && options.meetId) this.setData({ meetId: options.meetId });
      this.setData({ isLoad: true });
    },
    url(e) { router.url(e, this); },
    bindSetDaysTap() {
      cloud.callCloudSubmit('work/meet_set_days', { meetId: this.data.meetId }, { title: '处理中' }).then(() => {
        toast.showSuccToast('操作成功');
      }).catch(err => console.error(err));
    },
  }
});
