/**
 * Notes: 资讯后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 07-11 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const AdminHomeService = require('../admin/admin_home_service.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const util = require('../../../../framework/utils/util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');
const setupUtil = require('../../../../framework/utils/setup/setup_util.js');
const constants = require('../../public/constants.js');

const NewsModel = require('../../model/news_model.js');

class AdminNewsService extends BaseProjectAdminService {

	/** 推荐首页SETUP */
	async vouchNewsSetup(id, vouch) {
		// 从系统设置读取当前首页推荐列表
		let vouchList = await setupUtil.get(constants.SETUP_HOME_VOUCH_KEY);
		if (!vouchList || !Array.isArray(vouchList))
			vouchList = [];

		if (vouch == 1) {
			// 添加到推荐列表（不重复）
			if (!vouchList.includes(id))
				vouchList.push(id);
		} else {
			// 从推荐列表移除
			vouchList = vouchList.filter(v => v !== id);
		}

		await setupUtil.set(constants.SETUP_HOME_VOUCH_KEY, vouchList);
	}

	/**添加资讯 */
	async insertNews({
		title,
		cateId, //分类
		cateName,
		order,
		desc = '',
		forms
	}) {
		let data = {
			NEWS_TITLE: title,
			NEWS_CATE_ID: cateId,
			NEWS_CATE_NAME: cateName,
			NEWS_ORDER: order,
			NEWS_DESC: desc,
			NEWS_FORMS: forms || [],
		};
		return await NewsModel.insert(data);
	}

	/**删除资讯数据 */
	async delNews(id) {
		let where = { _id: id };
		let news = await NewsModel.getOne(where, 'NEWS_TITLE');
		if (!news)
			this.AppError('公告不存在');

		await NewsModel.del(where);
	}

	/**获取资讯信息 */
	async getNewsDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let news = await NewsModel.getOne(where, fields);
		if (!news) return null;

		return news;
	}

	// 更新forms信息
	async updateNewsForms({
		id,
		hasImageForms
	}) {
		await NewsModel.editForms(id, 'NEWS_FORMS', 'NEWS_OBJ', hasImageForms);

		//this.vouchNewsSetup(id, 1);
	}


	/**
	 * 更新富文本详细的内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateNewsContent({
		id,
		content // 富文本数组
	}) {
		let where = { _id: id };
		await NewsModel.edit(where, { NEWS_CONTENT: content });
	}

	/**
	 * 更新资讯图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateNewsPic({
		id,
		imgList // 图片数组
	}) {
		let where = { _id: id };
		await NewsModel.edit(where, { NEWS_PIC: imgList });
	}


	/**更新资讯数据 */
	async editNews({
		id,
		title,
		cateId, //分类
		cateName,
		order,
		desc = '',
		forms
	}) {
		let where = { _id: id };
		let data = {
			NEWS_TITLE: title,
			NEWS_CATE_ID: cateId,
			NEWS_CATE_NAME: cateName,
			NEWS_ORDER: order,
			NEWS_DESC: desc,
			NEWS_FORMS: forms || [],
		};
		await NewsModel.edit(where, data);
	}

	/**取得资讯分页列表 */
	async getAdminNewsList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'NEWS_ORDER': 'asc',
			'NEWS_ADD_TIME': 'desc'
		};
		let fields = 'NEWS_TITLE,NEWS_DESC,NEWS_CATE_ID,NEWS_CATE_NAME,NEWS_EDIT_TIME,NEWS_ADD_TIME,NEWS_ORDER,NEWS_STATUS,NEWS_CATE2_NAME,NEWS_VOUCH,NEWS_QR,NEWS_OBJ';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [
				{ NEWS_TITLE: ['like', search] },
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.and.NEWS_CATE_ID = String(sortVal);
					break;
				}
				case 'status': {
					where.and.NEWS_STATUS = Number(sortVal);
					break;
				}
				case 'vouch': {
					where.and.NEWS_VOUCH = 1;
					break;
				}
				case 'top': {
					where.and.NEWS_ORDER = 0;
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'NEWS_ADD_TIME');
					break;
				}

			}
		}

		return await NewsModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**修改资讯状态 */
	async statusNews(id, status) {
		let where = { _id: id };
		await NewsModel.edit(where, { NEWS_STATUS: status });
	}

	/**置顶与排序设定 */
	async sortNews(id, sort) {
		let where = { _id: id };
		await NewsModel.edit(where, { NEWS_ORDER: sort });
	}

	/**首页设定 */
	async vouchNews(id, vouch) {
		let where = { _id: id };
		await NewsModel.edit(where, { NEWS_VOUCH: vouch });
	}
}

module.exports = AdminNewsService;