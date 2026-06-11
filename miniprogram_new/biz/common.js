/**
 * 通用业务模块
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const { fmtText } = require('../utils/data.js');

/** 根据分类 ID 获取分类名称 */
const getCateName = (cateId, cateList) => {
  for (let k = 0; k < cateList.length; k++) {
    if (cateList[k].id == cateId) return cateList[k].title;
  }
  return '';
};

/** 将分类列表转为 picker 选项格式 */
const getCateList = (cateList) =>
  cateList.map((item) => ({
    label: item.title,
    type: 'cateId',
    val: item.id,
    value: item.id,
  }));

/** 根据分类 ID 设置导航栏标题 */
const setCateTitle = (cateList, cateId = null) => {
  const pages = getCurrentPages();
  const curPage = pages[pages.length - 1];
  if (!curPage) return;

  if (!cateId && curPage.options?.id) cateId = curPage.options.id;

  for (let k = 0; k < cateList.length; k++) {
    if (cateList[k].id == cateId) {
      wx.setNavigationBarTitle({ title: cateList[k].title });
      curPage.setData({ listMode: cateList[k].style || '' });
      return;
    }
  }
};

/** 从富文本内容中提取简介 */
const getRichEditorDesc = (desc, content) => {
  if (desc) return fmtText(desc, 100);
  if (!Array.isArray(content)) return desc;
  for (let k = 0; k < content.length; k++) {
    if (content[k].type === 'text') return fmtText(content[k].val, 100);
  }
  return desc;
};

module.exports = {
  getCateName,
  getCateList,
  setCateTitle,
  getRichEditorDesc,
};
