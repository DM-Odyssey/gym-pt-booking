/**
 * 云函数调用封装
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */

const { isDefined } = require('./helper.js');
const cache = require('./cache.js');
const constants = require('./constants.js');
const setting = require('../config/setting.js');
const timeHelper = require('./time.js');
const dataHelper = require('./data.js');
const router = require('./router.js');

// 云函数名（后端已重构为 main）
const CLOUD_FUNC = 'main';

// 错误码（与后端 common/response.js 对齐）
const CODE = {
  SUCC: 200,
  SVR: 500,
  LOGIC: 1600,
  DATA: 1301,
  ADMIN_ERROR: 2401,
  WORK_ERROR: 2501,
};

/** 根据路由前缀获取对应 token */
const getTokenForRoute = (route) => {
  if (route.startsWith('admin/')) {
    const admin = cache.get(constants.CACHE_ADMIN);
    return admin?.token || '';
  }
  if (route.startsWith('work/')) {
    const work = cache.get(constants.CACHE_WORK);
    return work?.token || '';
  }
  const user = cache.get(constants.CACHE_TOKEN);
  return user?.id || '';
};

/**
 * 核心云函数调用
 * @param {string} route - 路由（如 'home/list'）
 * @param {Object} params - 请求参数
 * @param {Object} options - { title, hint, doFail }
 * @returns {Promise} resolve 返回 { code, msg, data }
 */
const callCloud = (route, params = {}, options) => {
  let title = '加载中';
  let hint = true;

  if (isDefined(options)) {
    if (isDefined(options.title)) title = options.title;
    if (isDefined(options.hint)) hint = options.hint;
    // doFail 预留
  }

  if (hint) {
    if (title === 'bar') wx.showNavigationBarLoading();
    else wx.showLoading({ title, mask: true });
  }

  const token = getTokenForRoute(route);

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CLOUD_FUNC,
      data: {
        route,
        token,
        PID: setting.PID,
        params,
      },
      success: (res) => {
        const result = res.result;

        if (result.code === CODE.LOGIC || result.code === CODE.DATA) {
          // 逻辑错误 / 数据校验错误
          if (hint) {
            wx.showModal({
              title: '温馨提示',
              content: result.msg,
              showCancel: false,
            });
          }
          reject(result);
          return;
        }

        if (result.code === CODE.ADMIN_ERROR) {
          // 管理员鉴权失败 → 跳转后台登录页
          wx.reLaunch({
            url: '/pages/admin/login/admin_login',
          });
          return;
        }

        if (result.code === CODE.WORK_ERROR) {
          // 教练鉴权失败 → 跳转教练登录页
          wx.reLaunch({
            url: '/pages/work/login/work_login',
          });
          return;
        }

        if (result.code !== CODE.SUCC) {
          if (hint) {
            wx.showModal({
              title: '温馨提示',
              content: '系统开小差了，请稍后重试',
              showCancel: false,
            });
          }
          reject(result);
          return;
        }

        resolve(result);
      },
      fail: (err) => {
        if (hint) {
          console.error(err);
          if (err?.errMsg?.includes('-501000') && err.errMsg.includes('Environment not found')) {
            wx.showModal({
              title: '',
              content: '未找到云环境ID，请检查前端配置文件 config/setting.js 的配置项 CLOUD_ID',
              showCancel: false,
            });
          } else if (err?.errMsg?.includes('-501000') && err.errMsg.includes('FunctionName')) {
            wx.showModal({
              title: '',
              content: '云函数未创建或者未上传，请检查云函数 main 是否部署',
              showCancel: false,
            });
          } else if (err?.errMsg?.includes('-501000') && err.errMsg.includes('performed in the current function state')) {
            wx.showModal({
              title: '',
              content: '云函数正在上传中，请稍候',
              showCancel: false,
            });
          } else {
            wx.showModal({
              title: '',
              content: '网络故障，请稍后重试',
              showCancel: false,
            });
          }
        }
        reject(err.result);
      },
      complete: () => {
        if (hint) {
          if (title === 'bar') wx.hideNavigationBarLoading();
          else wx.hideLoading();
        }
      },
    });
  });
};

/** 调用并返回 .data（失败返回 null） */
const callCloudData = async (route, params = {}, options = {}) => {
  try {
    const result = await callCloud(route, params, { title: '加载中..', ...options });
    if (result && isDefined(result.data)) {
      let data = result.data;
      if (Array.isArray(data)) {
        // 保持数组
      } else if (Object.keys(data).length === 0) {
        data = null;
      }
      return data;
    }
    return null;
  } catch (err) {
    return null;
  }
};

/** 提交数据（带"提交中..."提示） */
const callCloudSubmit = (route, params = {}, options = {}) =>
  callCloud(route, params, { title: '提交中..', ...options });

/** 异步提交（不阻塞 UI） */
const callCloudSubmitAsync = (route, params = {}, options = {}) =>
  callCloud(route, params, { hint: false, ...options });

/**
 * 分页列表数据管理
 * @param {Object} that - 页面/组件 this
 * @param {string} listName - data 中的列表名
 * @param {string} route - API 路由
 * @param {Object} params - 请求参数
 * @param {Object} options - 调用选项
 * @param {boolean} isReverse - 是否反向拼接（上拉加载更多为 false，下拉刷新用 true）
 */
const dataList = async (that, listName, route, params, options, isReverse = false) => {
  if (!that.data[listName]) {
    that.setData({
      [listName]: {
        page: 1,
        size: 20,
        list: [],
        count: 0,
        total: 0,
        oldTotal: 0,
      },
    });
  }

  if (!isDefined(params.isTotal)) params.isTotal = true;

  const page = params.page;
  const count = that.data[listName].count;
  if (page > 1 && page > count) {
    wx.showToast({ duration: 500, icon: 'none', title: '没有更多数据了' });
    return;
  }

  // 清理 undefined 参数
  Object.keys(params).forEach((k) => {
    if (!isDefined(params[k])) delete params[k];
  });

  let oldTotal = 0;
  if (that.data[listName]?.total) oldTotal = that.data[listName].total;
  params.oldTotal = oldTotal;

  try {
    const res = await callCloud(route, params, options);
    const dataListResult = res.data;
    let tList = that.data[listName].list;

    if (dataListResult.page === 1) {
      tList = dataListResult.list;
    } else if (dataListResult.page > that.data[listName].page) {
      tList = isReverse
        ? dataListResult.list.concat(tList)
        : tList.concat(dataListResult.list);
    } else {
      return;
    }

    dataListResult.list = tList;
    that.setData({ [listName]: dataListResult });
  } catch (err) {
    console.error('dataList error:', err);
  }
};

/** 获取云存储文件的临时下载链接 */
const getTempFileURLOne = async (fileID) => {
  if (!fileID) return '';
  try {
    const result = await wx.cloud.getTempFileURL({ fileList: [fileID] });
    if (result?.fileList?.[0]?.tempFileURL) return result.fileList[0].tempFileURL;
  } catch (err) {
    console.error(err);
  }
  return '';
};

/** 将临时图片上传到云存储 */
const transTempPics = async (imgList, dir, id, prefix = '') => {
  if (setting.IS_DEMO) return imgList;

  if (prefix && !prefix.endsWith('_')) prefix += '_';
  if (!id) id = timeHelper.time('YMD');

  for (let i = 0; i < imgList.length; i++) {
    const filePath = imgList[i];
    const ext = filePath.match(/\.[^.]+?$/)?.[0];
    if (!ext) continue;

    if (filePath.includes('tmp') || filePath.includes('temp') || filePath.includes('wxfile')) {
      const rd = dataHelper.genRandomNum(1000000, 9999999);
      const cloudPath = id ? `${dir}${id}/${prefix}${rd}${ext}` : `${dir}${prefix}${rd}${ext}`;

      try {
        const res = await wx.cloud.uploadFile({ cloudPath, filePath });
        imgList[i] = res.fileID;
      } catch (err) {
        console.error('uploadFile error:', err);
      }
    }
  }

  return imgList;
};

/** 上传单张图片（可选内容安全检测） */
const transTempPicOne = async (img, dir, id, isCheck = true) => {
  if (isCheck) {
    wx.showLoading({ title: '图片校验中', mask: true });
    // TODO: 接入图片内容安全检测（需要后端的 security.msgSecCheck）
    wx.hideLoading();
  }

  const imgList = [img];
  const result = await transTempPics(imgList, dir, id);
  return result.length > 0 ? result[0] : '';
};

/** 富文本编辑器图片上传 */
const transRichEditorTempPics = async (content, dir, id, route) => {
  let imgList = [];
  for (let k = 0; k < content.length; k++) {
    if (content[k].type === 'img') imgList.push(content[k].val);
  }

  imgList = await transTempPics(imgList, dir, id, 'rich');

  let imgIdx = 0;
  for (let k = 0; k < content.length; k++) {
    if (content[k].type === 'img') content[k].val = imgList[imgIdx++];
  }

  try {
    await callCloudSubmit(route, { id, content });
    return content;
  } catch (e) {
    console.error(e);
  }
  return [];
};

/** 封面图片上传 */
const transCoverTempPics = async (imgList, dir, id, route) => {
  imgList = await transTempPics(imgList, dir, id, 'cover');

  try {
    const res = await callCloudSubmit(route, { id, imgList });
    return res.data?.urls;
  } catch (err) {
    console.error(err);
  }
};

/** 表单图片上传 */
const transFormsTempPics = async (forms, dir, id, route) => {
  wx.showLoading({ title: '提交中...', mask: true });

  let hasImageForms = [];
  for (let k = 0; k < forms.length; k++) {
    if (forms[k].type === 'image') {
      forms[k].val = await transTempPics(forms[k].val, dir, id, 'image');
      hasImageForms.push(forms[k]);
    } else if (forms[k].type === 'content') {
      const contentVal = forms[k].val;
      for (let j in contentVal) {
        if (contentVal[j].type === 'img') {
          const ret = await transTempPics([contentVal[j].val], dir, id, 'content');
          contentVal[j].val = ret[0];
        }
      }
      hasImageForms.push(forms[k]);
    }
  }

  if (hasImageForms.length === 0) return;

  try {
    await callCloudSubmit(route, { id, hasImageForms });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  CODE,
  CLOUD_FUNC,
  callCloud,
  callCloudData,
  callCloudSubmit,
  callCloudSubmitAsync,
  dataList,
  getTempFileURLOne,
  transTempPics,
  transTempPicOne,
  transRichEditorTempPics,
  transCoverTempPics,
  transFormsTempPics,
};
