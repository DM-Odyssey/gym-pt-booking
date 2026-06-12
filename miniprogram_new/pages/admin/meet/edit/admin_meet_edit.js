const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const form = require('../../../../utils/form.js');
const list = require('../../../../utils/list.js');
const timeHelper = require('../../../../utils/time.js');
const validate = require('../../../../utils/validate.js');
const admin = require('../../../../biz/admin.js');
const adminMeet = require('../../../../biz/admin_meet.js');
const pageInit = require('../../../../utils/page_init.js');

Component({
  data: { isLoad: false, isEdit: true, isAdmin: true, formCancelSet: "1" },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options)) return;
      wx.setNavigationBarTitle({ title: '课程-设置' });
      this.setData(adminMeet.initFormData());
      this._loadDetail();
    },
    async _loadDetail() {
      var id = this.data.id; if (!id) return;
      var meetData = await cloud.callCloudData('admin/meet_detail', { id: id }, { title: 'bar' });
      if (!meetData) { this.setData({ isLoad: null }); return; }
      this.setData({
        isLoad: true, formTitle: meetData.MEET_TITLE, formCateId: meetData.MEET_CATE_ID,
        formOrder: meetData.MEET_ORDER, formCancelSet: String(meetData.MEET_CANCEL_SET || "1"),
        formPhone: meetData.MEET_PHONE, formForms: Array.isArray(meetData.MEET_FORMS) ? meetData.MEET_FORMS : [],
        formDaysSet: meetData.MEET_DAYS_SET || [], formJoinForms: meetData.MEET_JOIN_FORMS || [],
      });
    },
    url(e) { router.url(e, this); },
    bindCateIdSelect(e) { this.setData({ formCateId: e.detail }); if (e.detail != 1) this.setData({ formPhone: '', formPassword: '' }); },
    bindCancelSetSelect(e) { this.setData({ formCancelSet: e.detail }); },
    bindJoinFormsCmpt(e) { this.setData({ formJoinForms: e.detail }); },

    bindFormEditSubmit: async function() {
      form.formClearFocus(this);
      if (!admin.isAdmin(this)) return;
      var data = this.data;
      if (data.formDaysSet.length <= 0) { router.anchor('formDaysSet', this); return form.formHint(this, 'formDaysSet', '请配置「可预约时段」'); }
      data = validate.check(data, adminMeet.CHECK_FORM, this);
      if (!data) return;
      data.daysSet = data.formDaysSet; data.joinForms = data.formJoinForms;
      data.cateName = adminMeet.getCateName(data.cateId);
      var forms = this.selectComponent('#cmpt-form')?.getForms?.(true);
      if (!forms) return;
      data.forms = forms;
      try {
        var meetId = this.data.id; data.id = meetId;
        await cloud.callCloudSubmit('admin/meet_edit', data);
        await cloud.transFormsTempPics(forms, 'meet/', meetId, 'admin/meet_update_forms');
        var node = { MEET_TITLE: data.title, MEET_CATE_NAME: data.cateName, MEET_DAYS_SET: data.daysSet,
          MEET_JOIN_FORMS: data.joinForms, MEET_EDIT_TIME: timeHelper.time('Y-M-D h:m:s'),
          leaveDay: adminMeet.getLeaveDay(data.daysSet) };
        list.modifyPrevPageListNodeObject(meetId, node);
        toast.showSuccToast('编辑成功', 2000, function() { wx.navigateBack(); });
      } catch (err) { console.error(err); }
    },
    onPullDownRefresh() { this._loadDetail().then(function() { wx.stopPullDownRefresh(); }); },
  }
});
