/**
 * 预约详情
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../../utils/cloud.js');
const router = require('../../../utils/router.js');
const pageInit = require('../../../utils/page_init.js');
const toast = require('../../../utils/toast.js');
const timeHelper = require('../../../utils/time.js');
const qrcodeLib = require('../../../lib/tools/qrcode_lib.js');
const auth = require('../../../biz/auth.js');

Component({
  data: {
    isLoad: false,
    isShowHome: false,
    join: null,
    qrImageData: '',
  },

  methods: {
    async onLoad(options) {
      if (!pageInit.initPageOptions(this, options)) return;
      if (!(await auth.loginMustBackWin(this))) return;

      if (options && options.flag === 'home') {
        this.setData({ isShowHome: true });
      }
      this._loadDetail();
    },

    async _loadDetail() {
      const id = this.data.id;
      if (!id) return;

      const params = { joinId: id };
      const opt = { title: 'bar' };
      try {
        const join = await cloud.callCloudData('meet/my_join_detail', params, opt);
        if (!join) {
          this.setData({ isLoad: null });
          return;
        }

        const qrImageData = qrcodeLib.drawImg('meet=' + join.JOIN_CODE, {
          typeNumber: 1,
          errorCorrectLevel: 'L',
          size: 100,
        });

        this.setData({ isLoad: true, join, qrImageData });
      } catch (err) {
        console.error(err);
      }
    },

    url(e) {
      router.url(e, this);
    },

    bindCalendarTap() {
      const join = this.data.join;
      const title = join.JOIN_MEET_TITLE;
      const startTime = timeHelper.time2Timestamp(join.JOIN_MEET_DAY + ' ' + join.JOIN_MEET_TIME_START + ':00') / 1000;
      const endTime = timeHelper.time2Timestamp(join.JOIN_MEET_DAY + ' ' + join.JOIN_MEET_TIME_END + ':00') / 1000;

      wx.addPhoneCalendar({
        title,
        startTime,
        endTime,
        alarm: 'true',
        alarmOffset: 3600,
        success: () => toast.showSuccToast('添加成功'),
        fail: (res) => {
          if (res?.errMsg?.includes('refuesed')) {
            toast.showModal('请在手机的"设置>微信"选项中，允许微信访问你的日历', '日历权限未开启');
          }
        },
      });
    },

    onPullDownRefresh() {
      this._loadDetail().then(() => wx.stopPullDownRefresh());
    },

    onShareAppMessage() {},
  },
});
