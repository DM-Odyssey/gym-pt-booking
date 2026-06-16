/**
 * DOM 与滚动操作工具
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const { isDefined } = require('./helper.js');

/** 从事件对象中取得 data- 属性 */
const dataset = (e, name, child = false) => {
  if (child) return e.target.dataset[name];
  return e.currentTarget.dataset[name];
};

/** 列表项触摸开始 */
const listTouchStart = (e, that) => {
  that.setData({ touchX: e.touches[0].pageX });
};

/** 列表项触摸方向检测 */
const listTouchMove = (e, that, precision = 50) => {
  const dx = that.data.touchX - e.touches[0].pageX;
  if (dx > precision) that.setData({ touchDirection: 'left' });
  else if (dx < -precision) that.setData({ touchDirection: 'right' });
};

/** 列表项触摸结束 */
const listTouchEnd = (e, that) => {
  that.setData({
    touchCur: that.data.touchDirection === 'left' ? e.currentTarget.dataset.idx : null,
    touchDirection: null,
  });
};

/** 监听滚动位置，控制回到顶部按钮显示 */
const showTopBtn = (e, that) => {
  that.setData({ topBtnShow: e.scrollTop > 100 });
};

/** 滚动到页面顶部 */
const top = () => wx.pageScrollTo({ scrollTop: 0 });

/** 滚动到指定锚点 */
const anchor = (id, that) => {
  try {
    const query = wx.createSelectorQuery().in(that);
    query.selectViewport().scrollOffset();
    query.select('#' + id).boundingClientRect();
    query.exec((res) => {
      if (!res || res.length < 2 || !res[0] || !res[1]) return;
      const target = res[0].scrollTop + res[1].top - 10;
      wx.pageScrollTo({ scrollTop: target, duration: 300 });
    });
  } catch (err) {
    console.error('anchor error:', err);
  }
};

/** 显示 Modal 弹窗 */
const bindShowModalTap = function (e) {
  this.setData({ modalName: e.currentTarget.dataset.modal });
};

/** 隐藏 Modal 弹窗 */
const bindHideModalTap = function (e) {
  this.setData({ modalName: null });
};

module.exports = {
  dataset,
  listTouchStart,
  listTouchMove,
  listTouchEnd,
  showTopBtn,
  top,
  anchor,
  bindShowModalTap,
  bindHideModalTap,
};
