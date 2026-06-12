/**
 * 课程列表
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const router = require('../../../utils/router.js');
const list = require('../../../utils/list.js');

Component({
  data: {
    isLoad: false,
    _params: null,
    sortMenus: [],
    sortItems: [],
    dataList: null,
    search: '',
  },

  methods: {
    onLoad(options) {
      if (options && options.id) {
        this.setData({
          isLoad: true,
          _params: { cateId: options.id },
        });
      } else {
        this._getSearchMenu();
        this.setData({ isLoad: true });
      }
    },

    _getSearchMenu() {
      const meet = require('../../../services/meet.js');
      const common = require('../../../services/common.js');
      const cateList = common.getCateList(meet.MEET_CATE);

      let sortItem1 = [{ label: '全部', type: 'cateId', value: '' }];
      if (cateList.length > 1) sortItem1 = sortItem1.concat(cateList);

      this.setData({ sortItems: [], sortMenus: sortItem1 });
    },

    url(e) {
      router.url(e, this);
    },

    bindCommListCmpt(e) {
      list.commListListener(this, e);
    },

    onShareAppMessage() {},
  },
});
