const router = require('../../../utils/router.js');
const cloud = require('../../../utils/cloud.js');
const toast = require('../../../utils/toast.js');
const work = require('../../../services/work.js');
const validate = require('../../../utils/validate.js');

Component({ data: { isLoad: true, formOldPassword: '', formPassword: '', formPassword2: '' },
  methods: {
    onLoad() { if (!work.isWork(this)) return; },
    url(e) { router.url(e, this); },
    bindSubmitTap() {
      var data = validate.check(this.data, work.CHECK_FORM_MGR_PWD, this);
      if (!data) return;
      cloud.callCloudSubmit('work/password', data, { title: '提交中' }).then(function() {
        toast.showSuccToast('密码修改成功', 1500, function() { wx.navigateBack(); });
      }).catch(function(err) { console.error(err); });
    },
  }
});
