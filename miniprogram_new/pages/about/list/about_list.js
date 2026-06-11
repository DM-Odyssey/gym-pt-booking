/**
 * 关于列表
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');

Component({
  data: {
    isLoad: false,
    about: null,
  },

  methods: {
    async onLoad(options) {
      const key = (options && options.key) ? options.key : 'SETUP_CONTENT_ABOUT';
      await this._loadDetail(key);
    },

    async _loadDetail(key) {
      const opts = { title: 'bar' };
      const params = { key };
      const about = await cloud.callCloudData('home/setup_get', params, opts);
      if (!about) {
        this.setData({ about: [{ type: 'text', val: '' }], isLoad: true });
        return;
      }
      this.setData({ about, isLoad: true });
    },

    url(e) {
      router.url(e, this);
    },

    onPullDownRefresh() {
      const pages = getCurrentPages();
      const key = pages[pages.length - 1].options?.key || 'SETUP_CONTENT_ABOUT';
      this._loadDetail(key).then(() => wx.stopPullDownRefresh());
    },

    onShareAppMessage() {},
  },
});
