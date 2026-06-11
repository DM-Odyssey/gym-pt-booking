const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const admin = require('../../../../biz/admin.js');

Component({ data: { isLoad: false, oprt: 'admin' },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
  }
});
