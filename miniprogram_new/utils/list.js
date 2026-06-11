/**
 * 列表数据操作工具
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const { isDefined } = require('./helper.js');

/** 获取父页面 */
const getPrevPage = (deep = 2) => {
  const pages = getCurrentPages();
  return pages[pages.length - deep];
};

/** 修改列表中指定 id 项的某个字段 */
const modifyListNode = (id, list, valName, val, idName = '_id') => {
  if (!list || !Array.isArray(list)) return false;
  const pos = list.findIndex((item) => item[idName] === id);
  if (pos > -1) {
    list[pos][valName] = val;
    return true;
  }
  return false;
};

/** 从列表中删除指定 id 项 */
const delListNode = (id, list, idName = '_id') => {
  if (!list || !Array.isArray(list)) return false;
  const pos = list.findIndex((item) => item[idName] === id);
  if (pos > -1) {
    list.splice(pos, 1);
    return true;
  }
  return false;
};

/** 修改父页面列表中的某个字段 */
const modifyPrevPageListNode = (id, valName, val, deep = 2, listName = 'dataList', idName = '_id') => {
  const prevPage = getPrevPage(deep);
  if (!prevPage) return;
  const dataList = prevPage.data[listName];
  if (!dataList || !dataList.list) return;
  if (modifyListNode(id, dataList.list, valName, val, idName)) {
    prevPage.setData({ [listName + '.list']: dataList.list });
  }
};

/** 修改父页面列表中的一组字段 */
const modifyPrevPageListNodeObject = (id, vals, deep = 2, listName = 'dataList', idName = '_id') => {
  const prevPage = getPrevPage(deep);
  if (!prevPage) return;
  const dataList = prevPage.data[listName];
  if (!dataList || !dataList.list) return;
  Object.keys(vals).forEach((key) => modifyListNode(id, dataList.list, key, vals[key], idName));
  prevPage.setData({ [listName + '.list']: dataList.list });
};

/** 删除父页面列表中的某项 */
const delPrevPageListNode = (id, deep = 2, listName = 'dataList', idName = '_id') => {
  const prevPage = getPrevPage(deep);
  if (!prevPage) return;
  const dataList = prevPage.data[listName];
  if (!dataList || !dataList.list) return;
  const total = dataList.total - 1;
  if (delListNode(id, dataList.list, idName)) {
    prevPage.setData({
      [listName + '.list']: dataList.list,
      [listName + '.total']: total,
    });
  }
};

/** 刷新父页面列表 */
const refreshPrevListNode = async (deep = 2, listName = 'dataList', listFunc = '_getList') => {
  const prevPage = getPrevPage(deep);
  if (!prevPage || !prevPage.data[listName]) return;
  await prevPage[listFunc]();
};

/** 通用列表组件事件监听 */
const commListListener = (that, e) => {
  if (isDefined(e.detail.search)) {
    that.setData({ search: '', sortType: '' });
  } else {
    that.setData({ dataList: e.detail.dataList });
    if (e.detail.sortType) that.setData({ sortType: e.detail.sortType });
  }
};

module.exports = {
  getPrevPage,
  modifyListNode,
  delListNode,
  modifyPrevPageListNode,
  modifyPrevPageListNodeObject,
  delPrevPageListNode,
  refreshPrevListNode,
  commListListener,
};
