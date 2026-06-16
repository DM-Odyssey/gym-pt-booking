/**
 * 我的预约列表
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const cloud = require('../../../utils/cloud.js');
const router = require('../../../utils/router.js');
const list = require('../../../utils/list.js');
const toast = require('../../../utils/toast.js');
const auth = require('../../../services/auth.js');

Component({
  data: {
    isLoad: false,
    isLogin: true,
    _params: null,
    sortMenus: [],
    sortItems: [],
    dataList: null,
    search: '',
  },

  methods: {
    async onLoad(options) {
      if (!(await auth.loginMustBackWin(this))) return;

      if (options && options.status !== undefined) {
        this.setData({
          isLoad: true,
          _params: { sortType: options.status, sortVal: '' },
        });
      }
      this._getSearchMenu();
    },

    _getSearchMenu() {
      const sortMenus = [
        { label: '全部', type: '', value: '' },
        { label: '可使用', type: 'use', value: '' },
        { label: '已核销', type: 'check', value: '' },
        { label: '已过期', type: 'timeout', value: '' },
        { label: '系统取消', type: 'cancel', value: '' },
      ];

      this.setData({ search: '', sortItems: [], sortMenus, isLoad: true });
    },

    url(e) {
      router.url(e, this);
    },

    bindCommListCmpt(e) {
      list.commListListener(this, e);
    },

    bindCancelTap(e) {
      const callback = async () => {
        const joinId = e.currentTarget.dataset.id;
        try {
          const opts = { title: '取消中' };
          await cloud.callCloudSubmit('meet/my_join_cancel', { joinId }, opts);
          list.delListNode(joinId, this.data.dataList.list, '_id');
          this.data.dataList.total--;
          this.setData({ dataList: this.data.dataList });
          toast.showNoneToast('取消成功');
        } catch (err) {
          console.error(err);
        }
      };
      toast.showConfirm('确认取消该预约?', callback);
    },

    onShareAppMessage() {},
  },
});
