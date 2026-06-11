/**
 * 编辑个人资料
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const toast = require('../../utils/toast.js');
const validate = require('../../utils/validate.js');
const auth = require('../../biz/auth.js');

Component({
  data: {
    isLoad: false,
    isEdit: true,
    user: null,
    fields: [],
    formName: '',
    formMobile: '',
    formForms: [],
  },

  methods: {
    async onLoad() {
      await this._loadDetail();
    },

    async _loadDetail() {
      const opts = { title: 'bar' };
      const user = await cloud.callCloudData('passport/my_detail', {}, opts);
      if (!user) return wx.redirectTo({ url: '/pages/my/reg/my_reg' });

      this.setData({
        isLoad: true,
        isEdit: true,
        user,
        fields: [],
        formName: user.USER_NAME,
        formMobile: user.USER_MOBILE,
        formForms: Array.isArray(user.USER_FORMS) ? user.USER_FORMS : [],
      });
    },

    bindGetPhoneNumber(e) {
      auth.getPhone(e, this);
    },

    async bindSubmitTap() {
      try {
        let data = this.data;
        data = validate.check(data, auth.CHECK_FORM, this);
        if (!data) return;

        const forms = this.selectComponent('#cmpt-form').getForms(true);
        if (!forms) return;
        data.forms = forms;

        const opts = { title: '提交中' };
        await cloud.callCloudSubmit('passport/edit_base', data, opts);

        const callback = () => wx.reLaunch({ url: '/pages/my/index/my_index' });
        toast.showSuccToast('修改成功', 1500, callback);
      } catch (err) {
        console.error(err);
      }
    },

    onPullDownRefresh() {
      this._loadDetail().then(() => wx.stopPullDownRefresh());
    },
  },
});
