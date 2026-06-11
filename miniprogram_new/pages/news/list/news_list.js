/**
 * 公告列表
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const router = require('../../utils/router.js');
const cloud = require('../../utils/cloud.js');
const common = require('../../biz/common.js');
const news = require('../../biz/news.js');
const { setCateTitle } = common;

Component({
  data: {
    isLoad: false,
    _params: null,
    sortMenus: [],
    sortItems: [],
    dataList: null,
    search: '',
    listMode: 'leftbig1',
    isTotalMenu: true,
  },

  lifetimes: {
    attached() {},
  },

  pageLifetimes: {
    show() {},
  },

  methods: {
    onLoad(options) {
      const cateList = news.NEWS_CATE;

      if (options && options.id) {
        this.setData({
          isLoad: true,
          _params: { cateId: options.id },
        });
        setCateTitle(cateList);
      } else {
        this._getSearchMenu(cateList);
        this.setData({ isLoad: true });
      }
    },

    _getSearchMenu(cateList) {
      let sortItem1 = [{ label: '全部', type: 'cateId', value: '' }];
      sortItem1 = sortItem1.concat(common.getCateList(cateList));
      if (sortItem1.length <= 2) return;

      const sortMenus = sortItem1;
      this.setData({ sortItems: [], sortMenus });
    },

    url(e) {
      router.url(e, this);
    },

    bindCommListCmpt(e) {
      const list = require('../../utils/list.js');
      list.commListListener(this, e);
    },

    onShareAppMessage() {},
  },
});
