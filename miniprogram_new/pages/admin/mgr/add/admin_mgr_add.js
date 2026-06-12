const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const form = require('../../../../utils/form.js');
const validate = require('../../../../utils/validate.js');
const admin = require('../../../../biz/admin.js');
const common = require('../../../../biz/common.js');

Component({
  data: { isLoad: true, isAdmin: true, formName: '', formDesc: '', formPhone: '', formPassword: '' },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this, true)) return;
      if (options && options.id) this.setData({ id: options.id });
    },
    url(e) { router.url(e, this); },
    bindSubmitTap() {
      form.formClearFocus(this);
      if (!admin.isAdmin(this, true)) return;
      let data = this.data;
      data = validate.check(data, admin.CHECK_FORM_MGR_ADD, this);
      if (!data) return;
      let id = this.data.id;
      if (id) data.id = id;
      cloud.callCloudSubmit('admin/mgr_insert', data, { title: '提交中' }).then((res) => {
        common.removeCacheList('admin-mgr');
        toast.showSuccToast(id ? '修改成功' : '添加成功', 1500, function() { wx.navigateBack(); });
      }).catch(err => console.error(err));
    },
    onShareAppMessage() {},
  }
});