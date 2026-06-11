const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const work = require('../../../biz/work.js');
Component({ data: { isLoad: false, dataList: null },
  methods: {
    onLoad() { if (!work.isWork(this)) return; this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
    onShareAppMessage() {},
  }
});
