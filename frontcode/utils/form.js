/**
 * 表单操作工具
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const { showModal } = require('./toast.js');

/** 表单双向数据绑定（input 事件） */
const model = (that, e) => {
  const item = e.currentTarget.dataset.item;
  that.setData({ [item]: e.detail.value });
};

/** 开关控件数据绑定 */
const switchModel = (that, e, mode = 'int') => {
  const item = e.currentTarget.dataset.item;
  const sel = (mode === 'bool') ? e.detail.value : (e.detail.value ? 1 : 0);
  that.setData({ [item]: sel });
};

/** 清除所有表单焦点的提示状态 */
const formClearFocus = (that) => {
  const focus = {};
  Object.keys(that.data).forEach((key) => {
    if (key.startsWith('form') && !key.endsWith('Focus')) {
      focus[key + 'Focus'] = null;
    }
  });
  that.setData(focus);
};

/** 设置表单焦点提示并弹窗 */
const formHint = (that, formName, hint) => {
  that.setData({ [formName + 'Focus']: hint });
  return showModal(hint);
};

/** DB model 转表单对象（去掉字段前缀，转驼峰） */
const model2Form = (model) => {
  const newModel = {};
  Object.keys(model).forEach((key) => {
    const arr = key.split('_');
    let result = '';
    for (let i = 1; i < arr.length; i++) {
      const name = arr[i].toLowerCase();
      result += name.charAt(0).toUpperCase() + name.slice(1);
    }
    newModel['form' + result] = model[key];
  });
  return newModel;
};

/** picker 表单赋值到页面 data */
const setOptions = (that, options, name, val) => {
  let idx = options.indexOf(val);
  if (idx < 0) idx = 0;
  that.setData({ [name]: idx });
};

module.exports = {
  model,
  switchModel,
  formClearFocus,
  formHint,
  model2Form,
  setOptions,
};
