const router = require('../../../utils/router.js');
const work = require('../../../services/work.js');

Component({ data: { phone: '', pwd: '' },
  methods: {
    onLoad() { work.clearWorkToken(); },
    url(e) { router.url(e, this); },
    bindBackTap() { wx.reLaunch({ url: '/pages/my/index/my_index' }); },
    bindLoginTap() { work.workLogin(this, this.data.phone, this.data.pwd); },
  }
});
