/**
 * 公告详情
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const cloud = require('../../utils/cloud.js');
const router = require('../../utils/router.js');
const pageInit = require('../../utils/page_init.js');

Component({
  data: {
    isLoad: false,
    news: null,
    topBtnShow: false,
  },

  methods: {
    onLoad(options) {
      if (!pageInit.initPageOptions(this, options)) return;
      this._loadDetail();
    },

    async _loadDetail() {
      const id = this.data.id;
      if (!id) return;

      const params = { id };
      const opt = { title: 'bar' };
      const news = await cloud.callCloudData('news/view', params, opt);
      if (!news) {
        this.setData({ isLoad: null });
        return;
      }
      this.setData({ isLoad: true, news });
    },

    url(e) {
      router.url(e, this);
    },

    onPullDownRefresh() {
      this._loadDetail().then(() => wx.stopPullDownRefresh());
    },

    onPageScroll(e) {
      this.setData({ topBtnShow: e.scrollTop > 100 });
    },

    onShareAppMessage() {
      return {
        title: this.data.news?.NEWS_TITLE,
        imageUrl: this.data.news?.NEWS_PIC?.[0],
      };
    },
  },
});
