/**
 * 资讯添加
 * Author: DM-Odyssey
 * Date: 2026-06-11
 */
const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const validate = require('../../../../utils/validate.js');
const admin = require('../../../../services/admin.js');
const common = require('../../../../services/common.js');
const { setContentDesc } = admin;

Component({
  data: {
    isLoad: false, isEdit: false,
    contentDesc: '', cateIdOptions: [], fields: [], imgList: [],
    formOrder: 9999, formTitle: '', formDesc: '', formContent: [], formCateId: '', formForms: [],
  },
  methods: {
    onLoad() {
      if (!admin.isAdmin(this)) return;
      wx.setNavigationBarTitle({ title: '公告-添加' });
      this.setData({
        isLoad: true, contentDesc: '', cateIdOptions: [], fields: [], imgList: [],
        formOrder: 9999, formTitle: '', formDesc: '', formContent: [], formCateId: '', formForms: [],
      }, () => setContentDesc(this));
    },
    url(e) { router.url(e, this); },
    model(e) { const k = e.currentTarget.dataset.item; this.setData({ [k]: e.detail.value }); },
    bindImgUploadCmpt(e) { this.setData({ imgList: e.detail }); },

    async bindFormSubmit() {
      if (!admin.isAdmin(this)) return;
      let data = this.data;
      if (data.formContent.length === 0) return toast.showModal('详细内容不能为空');
      data = validate.check(data, {
        title: 'formTitle|must|string|min:4|max:50|name=标题',
        cateId: 'formCateId|must|id|name=分类',
        order: 'formOrder|must|int|min:0|max:9999|name=排序号',
        desc: 'formDesc|string|min:10|max:200|name=简介',
      }, this);
      if (!data) return;

      const forms = this.selectComponent('#cmpt-form')?.getForms?.(true);
      if (!forms) return;
      data.forms = forms;
      data.cateName = '';
      if (this.data.imgList.length === 0) return toast.showModal('请上传封面图');
      data.desc = common.getRichEditorDesc(data.desc, this.data.formContent);

      try {
        const result = await cloud.callCloudSubmit('admin/news_insert', data);
        const newsId = result.data.id;
        wx.showLoading({ title: '提交中...', mask: true });
        await cloud.transCoverTempPics(this.data.imgList, 'news/', newsId, 'admin/news_update_pic');
        if (this.data.formContent && this.data.formContent.length > 0) {
          const content = await cloud.transRichEditorTempPics(this.data.formContent, 'news/', newsId, 'admin/news_update_content');
          this.setData({ formContent: content });
        }
        await cloud.transFormsTempPics(forms, 'news/', newsId, 'admin/news_update_forms');
        common.removeCacheList('admin-news-list');
        common.removeCacheList('news-list');
        toast.showSuccToast('添加成功', 2000, () => wx.navigateBack());
      } catch (err) { console.error(err); }
    },
  }
});
