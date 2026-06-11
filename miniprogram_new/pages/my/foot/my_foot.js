/**
 * 浏览历史
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const router = require('../../utils/router.js');
const list = require('../../utils/list.js');

Component({
  data: {
    isLoad: true,
    _params: null,
    dataList: null,
  },

  methods: {
    url(e) {
      router.url(e, this);
    },

    bindCommListCmpt(e) {
      list.commListListener(this, e);
    },

    onShareAppMessage() {},
  },
});
