const router = require('../../../utils/router.js');
const admin = require('../../../biz/admin.js');
Component({ data: { name: '', pwd: '' },
  methods: {
    onLoad() { admin.clearAdminToken(); },
    url(e) { router.url(e, this); },
    bindBackTap() { wx.reLaunch({ url: '/pages/my/index/my_index' }); },
    bindLoginTap() { admin.adminLogin(this, this.data.name, this.data.pwd); },
  }
});
