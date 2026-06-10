/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 12-08 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const MeetService = require('../meet_service.js');
const AdminHomeService = require('../admin/admin_home_service.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const setupUtil = require('../../../../framework/utils/setup/setup_util.js');
const util = require('../../../../framework/utils/util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');
const cloudBase = require('../../../../framework/cloud/cloud_base.js');
const md5Lib = require('../../../../framework/lib/md5_lib.js');

const MeetModel = require('../../model/meet_model.js');
const JoinModel = require('../../model/join_model.js');
const DayModel = require('../../model/day_model.js');
const TempModel = require('../../model/temp_model.js');

const exportUtil = require('../../../../framework/utils/export_util.js');
const constants = require('../../public/constants.js');


// 导出报名数据KEY
const EXPORT_JOIN_DATA_KEY = 'EXPORT_JOIN_DATA';

class AdminMeetService extends BaseProjectAdminService {

	/** 推荐首页SETUP */
	async vouchMeetSetup(id, vouch) {
		let vouchList = await setupUtil.get(constants.SETUP_HOME_VOUCH_KEY);
		if (!vouchList || !Array.isArray(vouchList))
			vouchList = [];
		if (vouch == 1) {
			if (!vouchList.includes(id))
				vouchList.push(id);
		} else {
			vouchList = vouchList.filter(v => v !== id);
		}
		await setupUtil.set(constants.SETUP_HOME_VOUCH_KEY, vouchList);
	}


	/** 预约数据列表 */
	async getDayList(meetId, start, end) {
		let where = {
			DAY_MEET_ID: meetId,
			day: ['between', start, end]
		}
		let orderBy = {
			day: 'asc'
		}
		return await DayModel.getAllBig(where, 'day,times,dayDesc', orderBy);
	}

	// 按项目统计人数
	async statJoinCntByMeet(meetId) {
		let where = { JOIN_MEET_ID: meetId, JOIN_STATUS: JoinModel.STATUS.SUCC };
		return await JoinModel.count(where);
	}

	/** 管理员按钮核销 */
	async checkinJoin(joinId, flag) {
		let where = { _id: joinId };
		let data = {
			JOIN_IS_CHECKIN: flag ? 1 : 0,
			JOIN_CHECKIN_TIME: flag ? timeUtil.time() : 0
		};
		await JoinModel.edit(where, data);
	}

	/** 管理员扫码核销 */
	async scanJoin(meetId, code) {
		let where = { JOIN_MEET_ID: meetId, JOIN_CODE: code };
		let join = await JoinModel.getOne(where, 'JOIN_ID,JOIN_IS_CHECKIN');
		if (!join)
			this.AppError('预约码无效，未找到对应预约记录');
		if (join.JOIN_IS_CHECKIN)
			this.AppError('该预约码已经核销过了');

		await JoinModel.edit(where, {
			JOIN_IS_CHECKIN: 1,
			JOIN_CHECKIN_TIME: timeUtil.time()
		});
		return join;
	}

	/**
	 * 判断本日是否有预约记录
	 * @param {*} daySet daysSet的节点
	 */
	checkHasJoinCnt(times) {
		if (!times) return false;
		for (let k = 0; k < times.length; k++) {
			if (times[k].stat.succCnt) return true;
		}
		return false;
	}

	// 判断含有预约的日期
	getCanModifyDaysSet(daysSet) {
		let now = timeUtil.time('Y-M-D');

		for (let k = 0; k < daysSet.length; k++) {
			if (daysSet[k].day < now) continue;
			daysSet[k].hasJoin = this.checkHasJoinCnt(daysSet[k].times);
		}

		return daysSet;
	}

	/** 取消某个时间段的所有预约记录 */
	async cancelJoinByTimeMark(meetId, timeMark, reason) {
		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: timeMark,
			JOIN_STATUS: JoinModel.STATUS.SUCC
		};
		let data = {
			JOIN_STATUS: JoinModel.STATUS.ADMIN_CANCEL,
			JOIN_REASON: reason || '后台管理员取消'
		};
		await JoinModel.edit(where, data);
	}

	// 更新forms信息
	async updateMeetForms({
		id,
		hasImageForms
	}) {
		await MeetModel.editForms(id, 'MEET_FORMS', 'MEET_OBJ', hasImageForms);
	}


	/**添加 */
	async insertMeet(adminId, {
		title,
		order,
		cancelSet,
		cateId,
		cateName,
		daysSet,
		phone,
		password,
		forms,
		joinForms,
	}) {
		let data = {
			MEET_ADMIN_ID: adminId,
			MEET_TITLE: title,
			MEET_ORDER: order,
			MEET_CANCEL_SET: cancelSet,
			MEET_CATE_ID: cateId,
			MEET_CATE_NAME: cateName,
			MEET_DAYS: daysSet || [],
			MEET_PHONE: phone || '',
			MEET_PASSWORD: password ? md5Lib.md5(password) : '',
			MEET_FORMS: forms || [],
			MEET_JOIN_FORMS: joinForms || [],
		};
		let id = await MeetModel.insert(data);

		// 写入 Day 排期记录
		let nowDay = timeUtil.time('Y-M-D');
		await this._editDays(id, nowDay, daysSet || []);

		return { id };
	}


	/**排期设置 */
	async setDays(id, {
		daysSet,
	}) {
		// 1. 更新课程的 days 字段
		await MeetModel.edit({ _id: id }, { MEET_DAYS: daysSet || [] });

		// 2. 将排期数据写入 Day 集合（用户端预约从这里查）
		let nowDay = timeUtil.time('Y-M-D');
		await this._editDays(id, nowDay, daysSet || []);
	}


	/**删除数据 */
	async delMeet(id) {
		await MeetModel.del({ _id: id });
	}

	/**获取信息 */
	async getMeetDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let meet = await MeetModel.getOne(where, fields);
		if (!meet) return null;

		let meetService = new MeetService();
		meet.MEET_DAYS_SET = await meetService.getDaysSet(id, timeUtil.time('Y-M-D')); //今天及以后

		return meet;
	}


	/** 更新日期设置 */
	async _editDays(meetId, nowDay, daysSetData) {
		// 先删除该课程 old day 记录
		let dayWhere = {
			DAY_MEET_ID: meetId,
			day: ['<', nowDay]
		};
		await DayModel.del(dayWhere);

		// 批量插入/更新 day 记录
		for (let dayData of daysSetData) {
			if (dayData.day >= nowDay) {
				let exist = await DayModel.getOne({
					DAY_MEET_ID: meetId,
					day: dayData.day
				}, '_id');
				if (exist) {
					await DayModel.edit(exist._id, dayData);
				} else {
					await DayModel.insert(dayData);
				}
			}
		}
	}

	/**更新数据 */
	async editMeet({
		id,
		title,
		cateId,
		cateName,
		order,
		cancelSet,
		daysSet,
		phone,
		password,
		forms,
		joinForms
	}) {
		let where = { _id: id };
		let data = {
			MEET_TITLE: title,
			MEET_CATE_ID: cateId,
			MEET_CATE_NAME: cateName,
			MEET_ORDER: order,
			MEET_CANCEL_SET: cancelSet,
			MEET_DAYS: daysSet || [],
			MEET_FORMS: forms || [],
			MEET_JOIN_FORMS: joinForms || [],
		};
		if (phone)
			data.MEET_PHONE = phone;
		if (password)
			data.MEET_PASSWORD = md5Lib.md5(password);
		await MeetModel.edit(where, data);

		// 同步更新 Day 排期记录
		let nowDay = timeUtil.time('Y-M-D');
		await this._editDays(id, nowDay, daysSet || []);
	}

	/**预约名单分页列表 */
	async getJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		meetId,
		mark,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'JOIN_ADD_TIME': 'desc'
		};
		let fields = 'JOIN_IS_CHECKIN,JOIN_CHECKIN_TIME,JOIN_CODE,JOIN_ID,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_STATUS,JOIN_ADD_TIME';

		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: mark
		}; 
		if (util.isDefined(search) && search) {
			where['JOIN_FORMS.val'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					sortVal = Number(sortVal);
					if (sortVal == 1099) //取消的2种
						where.JOIN_STATUS = ['in', [10, 99]]
					else
						where.JOIN_STATUS = Number(sortVal);
					break;
				case 'checkin':
					// 核销
					where.JOIN_STATUS = JoinModel.STATUS.SUCC;
					if (sortVal == 1) {
						where.JOIN_IS_CHECKIN = 1;
					} else {
						where.JOIN_IS_CHECKIN = 0;
					}
					break;
			}
		}

		return await JoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**预约项目分页列表 */
	async getAdminMeetList({
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
			'MEET_ORDER': 'asc',
			'MEET_ADD_TIME': 'desc'
		};
		let fields = 'MEET_CATE_ID,MEET_CATE_NAME,MEET_TITLE,MEET_STATUS,MEET_DAYS,MEET_ADD_TIME,MEET_EDIT_TIME,MEET_ORDER,MEET_VOUCH,MEET_QR';

		let where = {};
		if (util.isDefined(search) && search) {
			where.MEET_TITLE = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					where.MEET_STATUS = Number(sortVal);
					break;
				case 'cateId':
					// 按类型
					where.MEET_CATE_ID = sortVal;
					break;
				case 'sort':
					// 排序
					if (sortVal == 'view') {
						orderBy = {
							'MEET_VIEW_CNT': 'desc',
							'MEET_ADD_TIME': 'desc'
						};
					}

					break;
			}
		}

		return await MeetModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 删除 */
	async delJoin(joinId) {
		await JoinModel.del({ _id: joinId });
	}

	/**修改报名状态 
	 * 特殊约定 99=>正常取消 
	 */
	async statusJoin(joinId, status, reason = '') {
		let where = { _id: joinId };
		let data = { JOIN_STATUS: status };
		if (reason)
			data.JOIN_REASON = reason;
		await JoinModel.edit(where, data);
	}

	/**修改项目状态 */
	async statusMeet(id, status) {
		await MeetModel.edit({ _id: id }, { MEET_STATUS: status });
	}

	/**置顶排序设定 */
	async sortMeet(id, sort) {
		await MeetModel.edit({ _id: id }, { MEET_ORDER: sort });
	}

	/**首页设定 */
	async vouchMeet(id, vouch) {
		await MeetModel.edit({ _id: id }, { MEET_VOUCH: vouch });
	}

	//##################模板
	/**添加模板 */
	async insertMeetTemp({
		name,
		times,
	}, meetId = 'admin') {
		let data = {
			TEMP_NAME: name,
			TEMP_TIMES: times || [],
			TEMP_MEET_ID: meetId
		};
		return await TempModel.insert(data);
	}

	/**更新数据 */
	async editMeetTemp({
		id,
		limit,
		isLimit
	}, meetId = 'admin') {
		let where = { _id: id };
		// 更新时段模板的 limit 设置（批量应用到所有 times）
		let temp = await TempModel.getOne(where, 'TEMP_TIMES');
		if (!temp) return;
		let times = (temp.TEMP_TIMES || []).map(t => ({
			...t,
			isLimit: isLimit || 0,
			limit: limit || 0
		}));
		await TempModel.edit(where, { TEMP_TIMES: times });
	}


	/**删除数据 */
	async delMeetTemp(id, meetId = 'admin') {
		await TempModel.del({ _id: id });
	}


	/**模板列表 */
	async getMeetTempList(meetId = 'admin') {
		let orderBy = {
			'TEMP_ADD_TIME': 'desc'
		};
		let fields = 'TEMP_NAME,TEMP_TIMES';

		let where = {
			TEMP_MEET_ID: meetId
		};
		return await TempModel.getAll(where, fields, orderBy);
	}

	// #####################导出报名数据
	/**获取报名数据 */
	async getJoinDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_JOIN_DATA_KEY);
	}

	/**删除报名数据 */
	async deleteJoinDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_JOIN_DATA_KEY);
	}

	/**导出报名数据 */
	async exportJoinDataExcel({
		meetId,
		startDay,
		endDay,
		status
	}) {
		let where = { JOIN_MEET_ID: meetId };
		if (startDay)
			where.JOIN_MEET_DAY = ['between', startDay, endDay];
		if (status)
			where.JOIN_STATUS = Number(status);

		let orderBy = { JOIN_ADD_TIME: 'desc' };
		let list = await JoinModel.getAllBig(where, '*', orderBy, 10000);

		let title = '预约数据';
		let dataArr = [['姓名', '手机', '课程', '日期', '时段', '状态', '预约时间']];
		for (let join of list) {
			let statusDesc = JoinModel.getDesc('STATUS', join.JOIN_STATUS);
			dataArr.push([
				join.JOIN_FORMS && join.JOIN_FORMS[0] ? join.JOIN_FORMS[0].val || '' : '',
				join.JOIN_FORMS && join.JOIN_FORMS[1] ? join.JOIN_FORMS[1].val || '' : '',
				join.JOIN_MEET_TITLE || '',
				join.JOIN_MEET_DAY || '',
				(join.JOIN_MEET_TIME_START || '') + '~' + (join.JOIN_MEET_TIME_END || ''),
				statusDesc,
				timeUtil.timestamp2Time(join.JOIN_ADD_TIME)
			]);
		}

		return await exportUtil.exportDataExcel(EXPORT_JOIN_DATA_KEY, title, list.length, dataArr);
	}

}

module.exports = AdminMeetService;