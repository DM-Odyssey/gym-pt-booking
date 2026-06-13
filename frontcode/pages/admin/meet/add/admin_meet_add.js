const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const form = require('../../../../utils/form.js');
const validate = require('../../../../utils/validate.js');
const admin = require('../../../../services/admin.js');
const adminMeet = require('../../../../services/admin_meet.js');

Component({
  data: { isLoad: true, isAdmin: true, formCancelSet: "1" },
  methods: {
    onLoad() {
      if (!admin.isAdmin(this)) return;
      wx.setNavigationBarTitle({ title: '课程-添加' });
      this.setData(adminMeet.initFormData());
    },
    url(e) { router.url(e, this); },
    bindCateIdSelect(e) { this.setData({ formCateId: e.detail }); if (e.detail != 1) this.setData({ formPhone: '', formPassword: '' }); },
    bindCancelSetSelect(e) { if (e.detail !== '' && e.detail !== undefined && e.detail !== this.data.formCancelSet) this.setData({ formCancelSet: e.detail }); },
    bindCostModeSelect(e) { if (e.detail !== '' && e.detail !== undefined) this.setData({ formCostMode: e.detail }); },
    bindJoinFormsCmpt(e) { this.setData({ formJoinForms: e.detail }); },

    bindFormAddSubmit: async function() {
      form.formClearFocus(this);
      if (!admin.isAdmin(this)) return;
      var data = this.data;
      if (data.formDaysSet.length <= 0) { router.anchor('formDaysSet', this); return form.formHint(this, 'formDaysSet', '请配置「可预约时段」'); }
      data = validate.check(data, adminMeet.CHECK_FORM, this);
      if (!data) return;
      data.daysSet = this.data.formDaysSet;
      data.joinForms = this.data.formJoinForms;
      data.cateName = adminMeet.getCateName(data.cateId);
      if (data.cateId == 1 && data.phone && !data.password) { router.anchor('formPassword', this); return form.formHint(this, 'formPassword', '请设置登录密码'); }
      var forms = this.selectComponent('#cmpt-form')?.getForms?.(true);
      if (!forms) return;
      data.forms = forms;
      try {
        var result = await cloud.callCloudSubmit('admin/meet_insert', data);
        var meetId = result.data.id;
        await cloud.transFormsTempPics(forms, 'meet/', meetId, 'admin/meet_update_forms');
        toast.showSuccToast('添加成功', 2000, function() { wx.navigateBack(); });
      } catch (err) { console.error(err); }
    },
  }
});
