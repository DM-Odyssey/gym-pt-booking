/**
 * Notes: 用户管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 01-22  07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const util = require('../../../../framework/utils/util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const UserModel = require('../../model/user_model.js');
const AdminHomeService = require('./admin_home_service.js');
const LogModel = require('../../../../framework/platform/model/log_model.js');

// 导出用户数据KEY
const EXPORT_USER_DATA_KEY = 'EXPORT_USER_DATA';

class AdminUserService extends BaseProjectAdminService {


	/** 获得某个用户信息 */
	async getUser({
		userId,
		fields = '*'
	}) {
		let where = {
			USER_MINI_OPENID: userId,
		}
		return await UserModel.getOne(where, fields);
	}

	/** 取得用户分页列表 */
	async getUserList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件 
		page,
		size,
		oldTotal = 0
	}) {

		orderBy = orderBy || {
			USER_ADD_TIME: 'desc'
		};
		let fields = '*';


		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [{
				USER_NAME: ['like', search]
			},
			{
				USER_MOBILE: ['like', search]
			},
			{
				USER_MEMO: ['like', search]
			},
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					where.and.USER_STATUS = Number(sortVal);
					break;
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'USER_ADD_TIME');
					break;
					}
			}
		}
		let result = await UserModel.getList(where, fields, orderBy, page, size, true, oldTotal, false);


		// 为导出增加一个参数condition
		result.condition = encodeURIComponent(JSON.stringify(where));

		return result;
	}

	async statusUser(id, status, reason) {
		// 1. 查是否存在（id 是 USER_MINI_OPENID）
		let where = { USER_MINI_OPENID: id };
		let user = await UserModel.getOne(where, 'USER_NAME');
		if (!user)
			this.AppError('用户不存在');

		// 2. 更新状态
		let data = { USER_STATUS: status };
		if (reason)
			data.USER_CHECK_REASON = reason;
		await UserModel.edit(where, data);

		// 3. 记日志
		let statusDesc = UserModel.getDesc('STATUS', status);
		this.insertLog(statusDesc + '了用户【' + user.USER_NAME + '】', user, LogModel.TYPE.USER);
	}

	/**删除用户 */
	async delUser(id) {
		// 1. 查是否存在（id 是 USER_MINI_OPENID）
		let where = { USER_MINI_OPENID: id };
		let user = await UserModel.getOne(where, 'USER_NAME');
		if (!user)
			this.AppError('用户不存在');

		// 2. 删除
		await UserModel.del(where);

		// 3. 记日志
		this.insertLog('删除了用户【' + user.USER_NAME + '】', user, LogModel.TYPE.USER);
	}

	// #####################导出用户数据

	/**获取用户数据 */
	async getUserDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_USER_DATA_KEY);
	}

	/**删除用户数据 */
	async deleteUserDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_USER_DATA_KEY);
	}

	/**导出用户数据 */
	async exportUserDataExcel(condition, fields) {
		// 1. 解析查询条件
		let where = {};
		if (condition) {
			where = JSON.parse(decodeURIComponent(condition));
		}

		// 2. 查所有匹配用户
		let orderBy = { USER_ADD_TIME: 'desc' };
		let list = await UserModel.getAllBig(where, '*', orderBy, 10000);

		// 3. 组装 Excel 数据（第一行是表头）
		let title = '用户数据';
		let dataArr = [];

		// 表头
		let header = ['姓名', '手机', '状态', '注册时间'];
		if (fields && fields.length > 0) {
			header = [...fields];
		}
		dataArr.push(header);

		// 数据行
		for (let user of list) {
			let statusDesc = UserModel.getDesc('STATUS', user.USER_STATUS);
			dataArr.push([
				user.USER_NAME || '',
				user.USER_MOBILE || '',
				statusDesc,
				timeUtil.timestamp2Time(user.USER_ADD_TIME)
			]);
		}

		// 4. 导出为 Excel 文件到云存储
		return await exportUtil.exportDataExcel(EXPORT_USER_DATA_KEY, title, list.length, dataArr);
	}

}

module.exports = AdminUserService;