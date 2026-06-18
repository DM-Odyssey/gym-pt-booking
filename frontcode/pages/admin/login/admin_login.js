const router = require('../../../utils/router.js');
const admin = require('../../../services/admin.js');
const cloud = require('../../../utils/cloud.js');
Component({ data: { name: '', pwd: '', showInit: false },
  methods: {
    onLoad() {
      admin.clearAdminToken();
      cloud.callCloudData('admin/check_init').then(res => {
        if (res && !res.initialized) this.setData({ showInit: true });
      }).catch(() => {
        this.setData({ showInit: true });
      });
    },
    url(e) { router.url(e, this); },
    bindBackTap() { wx.reLaunch({ url: '/pages/my/index/my_index' }); },
    bindLoginTap() { admin.adminLogin(this, this.data.name, this.data.pwd); },
    bindInitTap() {
      wx.showModal({
        title: '初始化系统',
        content: '将创建默认管理员(admin/123456)及示例数据，是否继续？',
        success: (res) => {
          if (!res.confirm) return;
          cloud.callCloudSubmit('admin/init', {}, { title: '初始化中' }).then(result => {
            this.setData({ showInit: false });
            wx.showModal({
              title: '初始化完成',
              content: (result && result.msg) || '初始化成功，请使用 admin / 123456 登录',
              showCancel: false
            });
          });
        }
      });
    },
  }
});
