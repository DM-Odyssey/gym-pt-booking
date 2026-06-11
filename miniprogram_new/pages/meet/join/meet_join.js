/**
 * 预约确认
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');
const pageInit = require('../../utils/page_init.js');
const toast = require('../../utils/toast.js');
const auth = require('../../biz/auth.js');

Component({
  data: {
    isLoad: false,
    meet: null,
    formsList: [],
    topBtnShow: false,
  },

  methods: {
    async onLoad(options) {
      if (!pageInit.initPageOptions(this, options)) return;
      if (!pageInit.initPageOptions(this, options, 'timeMark')) return;
      if (!(await auth.loginMustBackWin(this))) return;
      this._loadDetail();
    },

    async _loadDetail() {
      const id = this.data.id;
      const timeMark = this.data.timeMark;
      if (!id || !timeMark) return;

      const params = { meetId: id, timeMark };
      const opt = { title: 'bar' };
      const meet = await cloud.callCloudData('meet/detail_for_join', params, opt);
      if (!meet) {
        this.setData({ isLoad: null });
        return;
      }
      this.setData({ isLoad: true, meet });
    },

    url(e) {
      router.url(e, this);
    },

    bindSubmitCmpt(e) {
      const formsList = [e.detail];
      if (formsList.length === 0) return toast.showModal('请先填写资料');

      const doSubmit = async () => {
        try {
          const params = {
            meetId: this.data.id,
            timeMark: this.data.timeMark,
            formsList,
          };
          const opts = { title: '提交中' };
          await cloud.callCloudSubmit('meet/join', params, opts);

          wx.showModal({
            title: '温馨提示',
            content: '预约成功！',
            showCancel: false,
            success: () => {
              wx.reLaunch({ url: '/pages/meet/my-joins/meet_my_joins' });
            },
          });
        } catch (err) {
          console.error(err);
        }
      };
      doSubmit();
    },

    bindCheckTap() {
      this.selectComponent('#form-show').checkForms();
    },

    onPullDownRefresh() {
      this._loadDetail().then(() => wx.stopPullDownRefresh());
    },

    onPageScroll(e) {
      this.setData({ topBtnShow: e.scrollTop > 100 });
    },
  },
});
