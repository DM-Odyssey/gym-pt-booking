/**
 * 用户注册
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../../utils/cloud.js');
const toast = require('../../../utils/toast.js');
const validate = require('../../../utils/validate.js');
const auth = require('../../../biz/auth.js');

Component({
  data: {
    isLoad: false,
    isEdit: false,
    retUrl: '',
    fields: [],
    formName: '',
    formMobile: '',
    formForms: [],
  },

  methods: {
    async onLoad(options) {
      if (options && options.retUrl) {
        this.setData({ retUrl: decodeURIComponent(options.retUrl) });
      }
      await this._loadDetail();
    },

    async _loadDetail() {
      const opts = { title: 'bar' };
      const user = await cloud.callCloudData('passport/my_detail', {}, opts);
      if (user) {
        return wx.redirectTo({ url: '/pages/my/index/my_index' });
      }

      this.setData({
        isLoad: true,
        fields: [],
        formName: '',
        formMobile: '',
        formForms: [],
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
        data.status = 1;

        const opts = { title: '提交中' };
        const result = await cloud.callCloudSubmit('passport/register', data, opts);

        if (result && result.data && result.data.token) {
          auth.setToken(result.data.token);

          const callback = () => {
            const retUrl = this.data.retUrl;
            if (retUrl === 'back') wx.navigateBack();
            else if (retUrl) wx.redirectTo({ url: retUrl });
            else wx.reLaunch({ url: '/pages/my/index/my_index' });
          };

          toast.showSuccToast('注册成功', 1500, callback);
        }
      } catch (err) {
        console.error(err);
      }
    },
  },
});
