const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const admin = require('../../../../biz/admin.js');
Component({ data: { isLoad: false },
  methods: {
    onLoad(options) { if (!admin.isAdmin(this)) return; if (options && options.id) this.setData({ id: options.id }); this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
    onShareAppMessage() {},
  }
});
