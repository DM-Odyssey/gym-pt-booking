const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const form = require('../../../../utils/form.js');
const list = require('../../../../utils/list.js');
const validate = require('../../../../utils/validate.js');
const admin = require('../../../../services/admin.js');
const pageInit = require('../../../../utils/page_init.js');

Component({
  data: { isLoad: false, isAdmin: false, formName: '', formDesc: '', formPhone: '', formPassword: '' },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this, true)) return;
      if (!pageInit.initPageOptions(this, options)) return;
      this._loadDetail();
    },
    async _loadDetail() {
      if (!admin.isAdmin(this, true)) return;
      let id = this.data.id;
      if (!id) return;
      let mgr = await cloud.callCloudData('admin/mgr_detail', { id }, { title: 'bar' });
      if (!mgr) { this.setData({ isLoad: null }); return; }
      this.setData({
        isLoad: true,
        formName: mgr.ADMIN_NAME,
        formDesc: mgr.ADMIN_DESC,
        formPhone: mgr.ADMIN_PHONE,
        formPassword: ''
      });
    },
    url(e) { router.url(e, this); },
    bindSubmitTap() {
      form.formClearFocus(this);
      if (!admin.isAdmin(this, true)) return;
      let data = this.data;
      data = validate.check(data, admin.CHECK_FORM_MGR_EDIT, this);
      if (!data) return;
      let adminId = this.data.id;
      data.id = adminId;
      cloud.callCloudSubmit('admin/mgr_edit', data, { title: '提交中' }).then((res) => {
        let node = { ADMIN_NAME: data.name, ADMIN_DESC: data.desc, ADMIN_PHONE: data.phone };
        list.modifyPrevPageListNodeObject(adminId, node);
        toast.showSuccToast('修改成功', 1500, function() { wx.navigateBack(); });
      }).catch(err => console.error(err));
    },
    onPullDownRefresh() { this._loadDetail().then(function() { wx.stopPullDownRefresh(); }); },
  }
});