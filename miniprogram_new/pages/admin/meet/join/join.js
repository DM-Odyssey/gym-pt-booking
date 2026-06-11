const router = require('../../../utils/router.js');
const list = require('../../../utils/list.js');
const admin = require('../../../biz/admin.js');
Component({ data: { isLoad: false, _params: null, sortMenus: [], sortItems: [], dataList: null, search: '' },
  methods: {
    onLoad() { if (!admin.isAdmin(this)) return; this.setData({ isLoad: true }); },
    url(e) { router.url(e, this); },
    bindCommListCmpt(e) { list.commListListener(this, e); },
    onShareAppMessage() {},
  }
});
