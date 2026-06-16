/**
 * Toast 与 Modal 提示工具
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

/** 成功提示 */
const showSuccToast = (title = '操作成功', duration = 1500, callback) =>
  wx.showToast({
    title,
    icon: 'success',
    duration,
    mask: true,
    success: () => { if (callback) setTimeout(callback, duration); },
  });

/** 成功提示后返回 */
const showSuccToastReturn = (title = '操作成功', duration = 1500) =>
  showSuccToast(title, duration, () => wx.navigateBack());

/** 错误提示 */
const showErrToast = (title = '操作失败', duration = 1500, callback) =>
  wx.showToast({
    title,
    icon: 'error',
    duration,
    mask: true,
    success: () => { if (callback) setTimeout(callback, duration); },
  });

/** 无图标提示 */
const showNoneToast = (title = '操作完成', duration = 1500, callback) =>
  wx.showToast({
    title,
    icon: 'none',
    duration,
    mask: true,
    success: () => { if (callback) setTimeout(callback, duration); },
  });

/** 无图标提示后返回 */
const showNoneToastReturn = (title = '操作完成', duration = 2000) =>
  showNoneToast(title, duration, () => wx.navigateBack());

/** 加载中提示 */
const showLoadingToast = (title = '加载中', duration = 1500, callback) =>
  wx.showToast({
    title,
    icon: 'loading',
    duration,
    mask: true,
    success: () => { if (callback) setTimeout(callback, duration); },
  });

/** 确认对话框 */
const showConfirm = (title = '确定要删除吗？', yes, no) =>
  wx.showModal({
    title: '',
    content: title,
    cancelText: '取消',
    confirmText: '确定',
    success: (res) => {
      if (res.confirm && yes) yes();
      else if (res.cancel && no) no();
    },
  });

/** 提示对话框（只有确定按钮） */
const showModal = (content, title = '温馨提示', callback = null, confirmText = '确定') =>
  wx.showModal({
    title,
    content,
    confirmText,
    showCancel: false,
    success: () => { if (callback) callback(); },
  });

/** 跳转到提示页面 */
const hint = (msg, type = 'redirect') => {
  const url = `/pages/public/hint?type=9&msg=${encodeURIComponent(msg)}`;
  if (type === 'reLaunch') wx.reLaunch({ url });
  else wx.redirectTo({ url });
};

module.exports = {
  showSuccToast,
  showSuccToastReturn,
  showErrToast,
  showNoneToast,
  showNoneToastReturn,
  showLoadingToast,
  showConfirm,
  showModal,
  hint,
};
