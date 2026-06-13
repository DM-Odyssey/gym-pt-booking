const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const admin = require('../../../../services/admin.js');
const pageInit = require('../../../../utils/page_init.js');

const CARD_TYPES = ['私教卡', '课程卡', '健身卡'];

Component({
  data: {
    isLoad: false,
    user: null,
    cards: [],
    // 发卡表单
    showCardForm: false,
    cardFormType: 1,     // 1=私教卡 2=课程卡 3=健身卡
    cardFormTotal: '',
    cardFormExpire: '',
    cardFormMemo: '',
    // 编辑卡
    editCardId: '',
    editCardTotal: '',
  },

  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options)) return;
      this._loadDetail();
    },

    async _loadDetail() {
      if (!admin.isAdmin(this)) return;
      const id = this.data.id; if (!id) return;
      const user = await cloud.callCloudData('admin/user_detail', { id }, { hint: false });
      if (!user) { this.setData({ isLoad: null }); return; }
      this.setData({ isLoad: true, user });

      // 加载该用户的卡
      try {
        const cards = await cloud.callCloudData('admin/card_user', { userId: id }, { hint: false });
        this.setData({ cards: cards || [] });
      } catch (e) {
        this.setData({ cards: [] });
      }
    },

    url(e) { router.url(e, this); },

    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
    onShareAppMessage() {},

    // ===== 发卡 =====

    bindShowCardForm() {
      this.setData({
        showCardForm: true,
        cardFormType: 1,
        cardFormTotal: '',
        cardFormExpire: '',
        cardFormMemo: ''
      });
    },

    bindHideCardForm() {
      this.setData({ showCardForm: false });
    },

    bindCardTypeSelect(e) {
      const idx = Number(e.currentTarget.dataset.idx);
      this.setData({ cardFormType: idx + 1 });
    },

    bindCardFormInput(e) {
      const field = e.currentTarget.dataset.field;
      this.setData({ [field]: e.detail.value });
    },

    async bindAddCard() {
      const userId = this.data.user.USER_MINI_OPENID;
      const cardType = this.data.cardFormType;
      const total = parseInt(this.data.cardFormTotal);
      const expire = this.data.cardFormExpire.trim();
      const memo = this.data.cardFormMemo.trim();

      if (!total || total < 1 || total > 999) {
        return wx.showToast({ title: '请输入有效次数（1-999）', icon: 'none' });
      }

      try {
        await cloud.callCloudSubmit('admin/card_add', {
          userId, cardType, total, expire, memo
        }, { title: '发卡中...' });
        wx.showToast({ title: '发卡成功', icon: 'success' });
        this.setData({ showCardForm: false });
        this._loadDetail();
      } catch (e) {
        console.error(e);
      }
    },

    // ===== 编辑卡 =====

    bindCardAction(e) {
      const cardId = e.currentTarget.dataset.cardid;
      wx.showActionSheet({
        itemList: ['追加次数', '修改有效期', '作废卡', '恢复有效', '删除卡'],
        success: (res) => {
          const idx = res.tapIndex;
          if (idx === 0) this._editAddTotal(cardId);
          else if (idx === 1) this._editExpire(cardId);
          else if (idx === 2) this._editStatus(cardId, 99);
          else if (idx === 3) this._editStatus(cardId, 1);
          else if (idx === 4) this._delCard(cardId);
        }
      });
    },

    _editAddTotal(cardId) {
      wx.showModal({
        title: '追加次数',
        editable: true,
        placeholderText: '输入追加次数（负数减少）',
        success: async (res) => {
          if (!res.confirm || !res.content) return;
          const addTotal = parseInt(res.content);
          if (isNaN(addTotal)) return wx.showToast({ title: '请输入数字', icon: 'none' });
          try {
            await cloud.callCloudSubmit('admin/card_edit', {
              cardId, addTotal
            }, { title: '更新中...' });
            wx.showToast({ title: '更新成功', icon: 'success' });
            this._loadDetail();
          } catch (e) { console.error(e); }
        }
      });
    },

    _editExpire(cardId) {
      wx.showModal({
        title: '修改有效期',
        editable: true,
        placeholderText: '格式: 2026-12-31（留空=永久）',
        success: async (res) => {
          if (!res.confirm) return;
          const expire = (res.content || '').trim();
          try {
            await cloud.callCloudSubmit('admin/card_edit', {
              cardId, expire
            }, { title: '更新中...' });
            wx.showToast({ title: '更新成功', icon: 'success' });
            this._loadDetail();
          } catch (e) { console.error(e); }
        }
      });
    },

    async _editStatus(cardId, status) {
      const confirmText = status === 99 ? '确认作废该卡？' : '确认恢复该卡为有效？';
      wx.showModal({
        title: '修改状态',
        content: confirmText,
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await cloud.callCloudSubmit('admin/card_edit', {
              cardId, status
            }, { title: '更新中...' });
            wx.showToast({ title: '更新成功', icon: 'success' });
            this._loadDetail();
          } catch (e) { console.error(e); }
        }
      });
    },

    _delCard(cardId) {
      wx.showModal({
        title: '删除卡',
        content: '确认删除该卡？仅能删除未消费的卡。',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await cloud.callCloudSubmit('admin/card_del', { cardId }, { title: '删除中...' });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this._loadDetail();
          } catch (e) { console.error(e); }
        }
      });
    },
  }
});
