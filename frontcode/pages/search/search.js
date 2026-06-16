/**
 * 搜索页
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const router = require('../../utils/router.js');
const cache = require('../../utils/cache.js');

Component({
  data: {
    type: '',
    returnUrl: '',
    cacheName: '',
    search: '',
    hisKeys: [],
  },

  methods: {
    onLoad(options) {
      const type = options.type || '';
      const returnUrl = options.returnUrl || '';
      const cacheName = 'SEARCH_HIS_' + type;

      const hisKeys = cache.get(cacheName, []);
      this.setData({ hisKeys, type, cacheName, returnUrl });
    },

    url(e) {
      router.url(e, this);
    },

    bindSearchConfirm() {
      if (!this.data.type) return;

      const search = this.data.search.trim();
      if (!search) return;

      // 存储搜索历史
      let hisKeys = this.data.hisKeys || [];
      if (!hisKeys.includes(search)) {
        hisKeys.unshift(search);
        if (hisKeys.length > 20) hisKeys.pop();
      }
      cache.set(this.data.cacheName, hisKeys, 86400 * 30);
      this.setData({ search, hisKeys });

      // 回传搜索词到上一页
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        prevPage.setData({ search });
      }
      wx.navigateBack();
    },

    bindDelHisTap() {
      cache.remove(this.data.cacheName);
      this.setData({ hisKeys: [] });
    },

    bindClearKeyTap() {
      this.setData({ search: '' });
    },

    bindKeyTap(e) {
      const search = e.currentTarget.dataset.key.trim();
      if (search) {
        this.setData({ search });
        this.bindSearchConfirm();
      }
    },
  },
});
