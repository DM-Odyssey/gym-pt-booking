/**
 * 图片处理工具
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */

const setting = require('../config/setting.js');
const { isDefined } = require('./helper.js');
const { showConfirm, showNoneToast } = require('./toast.js');

/** 请求相册写入权限 */
const getWritePhotosAlbum = (callback) => {
  wx.getSetting({
    success: (res) => {
      if (res.authSetting['scope.writePhotosAlbum']) {
        callback && callback();
      } else if (res.authSetting['scope.writePhotosAlbum'] === undefined) {
        wx.showModal({
          title: '提示',
          content: '您未开启保存图片到相册的权限，请点击确定去开启权限！',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.authorize({
                scope: 'scope.writePhotosAlbum',
                success: () => callback && callback(),
                fail: () => wx.showToast({ title: '您没有授权，无法保存到相册', icon: 'none' }),
              });
            }
          },
        });
      } else {
        wx.showModal({
          title: '提示',
          content: '您未开启保存图片到相册的权限，请点击确定去开启权限！',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    callback && callback();
                  } else {
                    wx.showToast({ title: '您没有授权，无法保存到相册！', icon: 'none' });
                  }
                },
              });
            } else {
              wx.showToast({ title: '您没有授权，无法保存到相册', icon: 'none' });
            }
          },
        });
      }
    },
  });
};

/** 图片预览 */
const previewImage = (that, url, imgListName = 'imgList') => {
  wx.previewImage({
    urls: that.data[imgListName],
    current: url,
  });
};

/** 删除图片（带确认） */
const delImage = (that, idx, imgListName = 'imgList') => {
  const callback = () => {
    that.data[imgListName].splice(idx, 1);
    that.setData({ [imgListName]: that.data[imgListName] });
  };
  showConfirm('确定要删除该图片吗？', callback);
};

/** 图片类型校验 */
const imgTypeCheck = (path, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp']) => {
  if (!path) return false;
  const ext = path.match(/\.[^.]+?$/);
  if (!ext) return false;
  return allowedTypes.some((t) => ext[0].toLowerCase() === '.' + t.toLowerCase());
};

/** 图片大小校验（MB） */
const imgSizeCheck = (size, maxSize) => {
  const max = maxSize || setting.IMG_UPLOAD_SIZE;
  return size <= max * 1024 * 1024;
};

module.exports = {
  getWritePhotosAlbum,
  previewImage,
  delImage,
  imgTypeCheck,
  imgSizeCheck,
};
