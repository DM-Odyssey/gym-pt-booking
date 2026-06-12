/**
 * 资讯编辑
 * Author: bjzm-mrzdp
 * Date: 2026-06-11
 */
const router = require('../../../../utils/router.js');
const cloud = require('../../../../utils/cloud.js');
const toast = require('../../../../utils/toast.js');
const validate = require('../../../../utils/validate.js');
const admin = require('../../../../services/admin.js');
const pageInit = require('../../../../utils/page_init.js');
const list = require('../../../../utils/list.js');
const common = require('../../../../services/common.js');
const { setContentDesc } = admin;

Component({
  data: {
    isLoad: false, isEdit: true,
    id: '', contentDesc: '', cateIdOptions: [], fields: [],
    imgList: [],
    formOrder: 9999, formTitle: '', formDesc: '', formContent: [], formCateId: '', formForms: [],
  },
  methods: {
    onLoad(options) {
      if (!admin.isAdmin(this)) return;
      if (!pageInit.initPageOptions(this, options)) return;
      wx.setNavigationBarTitle({ title: '公告-修改' });
      this._loadDetail();
    },
    url(e) { router.url(e, this); },

    async _loadDetail() {
      if (!admin.isAdmin(this)) return;
      const id = this.data.id; if (!id) return;
      if (!this.data.isLoad) this._initForm(id);
      try {
        const news = await cloud.callCloudData('admin/news_detail', { id }, { title: 'bar' });
        if (!news) { this.setData({ isLoad: null }); return; }
        this.setData({
          isLoad: true, imgList: news.NEWS_PIC || [],
          formCateId: news.NEWS_CATE_ID, formOrder: news.NEWS_ORDER,
          formTitle: news.NEWS_TITLE, formContent: news.NEWS_CONTENT || [],
          formDesc: news.NEWS_DESC || '',
          formForms: Array.isArray(news.NEWS_FORMS) ? news.NEWS_FORMS : [],
        }, () => { setContentDesc(this); });
      } catch (err) { console.error(err); }
    },

    _initForm(id) {
      this.setData({ id, contentDesc: '', cateIdOptions: [], fields: [], imgList: [],
        formOrder: 9999, formTitle: '', formDesc: '', formContent: [], formCateId: '', formForms: [],
      });
    },

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
      data.cateName = ''; // no category lookup needed
      if (this.data.imgList.length === 0) return toast.showModal('请上传封面图');

      const newsId = this.data.id; data.id = newsId;
      data.desc = common.getRichEditorDesc(data.desc, this.data.formContent);
      try {
        await cloud.callCloudSubmit('admin/news_edit', data);
        wx.showLoading({ title: '提交中...', mask: true });
        await cloud.transCoverTempPics(this.data.imgList, 'news/', newsId, 'admin/news_update_pic');
        const content = await cloud.transRichEditorTempPics(this.data.formContent, 'news/', newsId, 'admin/news_update_content');
        this.setData({ formContent: content });
        await cloud.transFormsTempPics(forms, 'news/', newsId, 'admin/news_update_forms');

        const node = { NEWS_TITLE: data.title, NEWS_CATE_NAME: data.cateName, NEWS_ORDER: data.order };
        list.modifyPrevPageListNodeObject(newsId, node);
        toast.showSuccToast('修改成功', 2000, () => wx.navigateBack());
      } catch (err) { console.error(err); }
    },

    onPullDownRefresh() { this._loadDetail().then(() => wx.stopPullDownRefresh()); },
  }
});
