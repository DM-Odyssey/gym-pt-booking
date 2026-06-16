const pageHelper = require('../../../../../utils/index.js');

Page({
  data: { formContent: [{ type: 'text', val: '' }] },

  onLoad: async function (options) {
    var parent = pageHelper.getPrevPage(2);
    if (!parent) return;
    if (!options || !options.cmptFormName) return;

    var cmptId = options.cmptId ? '#' + options.cmptId : '';
    var cmptFormName = options.cmptFormName;
    var formContent = [];
    var useParentData = true;

    // Try component first, fall back to parent data
    if (cmptId) {
      var cmpt = parent.selectComponent(cmptId);
      if (cmpt && cmpt.getOneFormVal) {
        formContent = cmpt.getOneFormVal(cmptFormName);
        useParentData = false;
      } else {
        formContent = parent.data[cmptFormName];
      }
    } else {
      formContent = parent.data[cmptFormName];
    }

    if (!formContent || formContent.length === 0) {
      formContent = [{ type: 'text', val: '' }];
    }

    this.setData({ cmptId: cmptId, cmptFormName: cmptFormName, useParentData: useParentData, formContent: formContent });

    var curPage = pageHelper.getPrevPage(1);
    if (curPage && curPage.options && curPage.options.source == 'admin') {
      wx.setNavigationBarColor({ backgroundColor: '#1A1A2E', frontColor: '#ffffff' });
    }
  },

  onReady: function () {},
  onShow: function () {},
  onHide: function () {},
  onUnload: function () {},
  onPullDownRefresh: async function () {},

  model: function (e) { pageHelper.model(this, e); },
  url: function (e) { pageHelper.url(e, this); },

  bindSaveTap: function (e) {
    var formContent = this.selectComponent("#contentEditor").getNodeList();
    var parent = pageHelper.getPrevPage(2);
    if (!parent) return;

    if (this.data.useParentData) {
      // Write directly to parent page data
      parent.setData({ [this.data.cmptFormName]: formContent });
    } else {
      // Write through cmpt-form-show component
      parent.selectComponent(this.data.cmptId).setOneFormVal(this.data.cmptFormName, formContent);
    }
    wx.navigateBack();
  }
});
