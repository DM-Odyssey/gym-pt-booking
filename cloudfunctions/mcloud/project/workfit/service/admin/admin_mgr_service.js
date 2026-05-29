/**
 * Notes: 管理员管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 07-11 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const AdminModel = require('../../../../framework/platform/model/admin_model.js');
const LogModel = require('../../../../framework/platform/model/log_model.js');
const md5Lib = require('../../../../framework/lib/md5_lib.js');

class AdminMgrService extends BaseProjectAdminService {

	//**管理员登录  */
	async adminLogin(name, password) {

		// 判断是否存在
		let where = {
			ADMIN_STATUS: 1,
			ADMIN_NAME: name,
			ADMIN_PASSWORD: md5Lib.md5(password)
		}
		let fields = 'ADMIN_ID,ADMIN_NAME,ADMIN_DESC,ADMIN_TYPE,ADMIN_LOGIN_TIME,ADMIN_LOGIN_CNT';
		let admin = await AdminModel.getOne(where, fields);
		if (!admin)
			this.AppError('管理员不存在或者已停用');

		let cnt = admin.ADMIN_LOGIN_CNT;

		// 生成token
		let token = dataUtil.genRandomString(32);
		let tokenTime = timeUtil.time();
		let data = {
			ADMIN_TOKEN: token,
			ADMIN_TOKEN_TIME: tokenTime,
			ADMIN_LOGIN_TIME: timeUtil.time(),
			ADMIN_LOGIN_CNT: cnt + 1
		}
		await AdminModel.edit(where, data);

		let type = admin.ADMIN_TYPE;
		let last = (!admin.ADMIN_LOGIN_TIME) ? '尚未登录' : timeUtil.timestamp2Time(admin.ADMIN_LOGIN_TIME);

		// 写日志
		this.insertLog('登录了系统', admin, LogModel.TYPE.SYS);

		return {
			token,
			name: admin.ADMIN_NAME,
			type,
			last,
			cnt
		}

	}

	async clearLog() {
		let where = {}
		await LogModel.del(where);
	}

	/** 取得日志分页列表 */
	async getLogList({
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
			LOG_ADD_TIME: 'desc'
		};
		let fields = '*';
		let where = {};

		if (util.isDefined(search) && search) {
			where.or = [{
				LOG_CONTENT: ['like', search]
			}, {
				LOG_ADMIN_DESC: ['like', search]
			}, {
				LOG_ADMIN_NAME: ['like', search]
			}];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'type':
					// 按类型
					where.LOG_TYPE = Number(sortVal);
					break;
			}
		}
		let result = await LogModel.getList(where, fields, orderBy, page, size, true, oldTotal);


		return result;
	}

	/** 获取所有管理员 */
	async getMgrList({
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
		orderBy = {
			ADMIN_ADD_TIME: 'desc'
		}
		let fields = 'ADMIN_NAME,ADMIN_STATUS,ADMIN_PHONE,ADMIN_TYPE,ADMIN_LOGIN_CNT,ADMIN_LOGIN_TIME,ADMIN_DESC,ADMIN_EDIT_TIME,ADMIN_EDIT_IP';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};
		if (util.isDefined(search) && search) {
			where.or = [{
				ADMIN_NAME: ['like', search]
			},
			{
				ADMIN_PHONE: ['like', search]
			},
			{
				ADMIN_DESC: ['like', search]
			}
			];
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					where.and.ADMIN_STATUS = Number(sortVal);
					break;
				case 'type':
					// 按类型
					where.and.ADMIN_TYPE = Number(sortVal);
					break;
			}
		}

		return await AdminModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 删除管理员 */
	async delMgr(id, myAdminId) {
		// 1. 查一下要删的管理员是否存在
		let where = { _id: id };
		let admin = await AdminModel.getOne(where, 'ADMIN_NAME,ADMIN_DESC');
		if (!admin)
			this.AppError('管理员不存在');

		// 2. 执行删除
		await AdminModel.del(where);

		// 3. 记录操作日志
		this.insertLog('删除了管理员【' + admin.ADMIN_NAME + '】', admin, LogModel.TYPE.SYS);
	}

	/** 添加新的管理员 */
	async insertMgr({
		name,
		desc,
		phone,
		password
	}) {
		// 1. 检查是否已存在同名账号
		let where = {
			ADMIN_NAME: name,
		}
		let exists = await AdminModel.getOne(where, 'ADMIN_ID');
		if (exists)
			this.AppError('该账号已存在');

		// 2. 准备数据（密码用 MD5 加密，参照 adminLogin 的写法）
		let data = {
			ADMIN_NAME: name,
			ADMIN_DESC: desc,
			ADMIN_PHONE: phone,
			ADMIN_PASSWORD: md5Lib.md5(password),
		}

		// 3. 插入数据库（ADMIN_ID、ADD_TIME、ADD_IP 等由 Model 层自动生成）
		let admin = await AdminModel.insert(data);

		// 4. 写操作日志
		this.insertLog('添加了管理员', admin, LogModel.TYPE.SYS);

	}

	/** 修改状态 */
	async statusMgr(id, status, myAdminId) {
		// 1. 查是否存在
		let where = { _id: id };
		let admin = await AdminModel.getOne(where, 'ADMIN_NAME,ADMIN_DESC');
		if (!admin)
			this.AppError('管理员不存在');

		// 2. 更新状态字段
		await AdminModel.edit(where, { ADMIN_STATUS: status });

		// 3. 记日志
		let statusDesc = status == 1 ? '启用' : '禁用';
		this.insertLog(statusDesc + '了管理员【' + admin.ADMIN_NAME + '】', admin, LogModel.TYPE.SYS);
	} 
 

	/** 获取管理员信息 */
	async getMgrDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let mgr = await AdminModel.getOne(where, fields);
		if (!mgr) return null;

		return mgr;
	}

	/** 修改管理员 */
	async editMgr(id, {
		name,
		desc,
		phone,
		password
	}) {
		// 1. 查是否存在
		let where = { _id: id };
		let admin = await AdminModel.getOne(where, 'ADMIN_NAME');
		if (!admin)
			this.AppError('管理员不存在');

		// 2. 检查新名字是否和别人冲突（排除自己）
		let existWhere = {
			ADMIN_NAME: name,
			_id: ['<>', id]
		};
		let exist = await AdminModel.getOne(existWhere, 'ADMIN_ID');
		if (exist)
			this.AppError('该账号名已被其他管理员使用');

		// 3. 组装要更新的数据
		let data = {
			ADMIN_NAME: name,
			ADMIN_DESC: desc,
			ADMIN_PHONE: phone,
		};
		if (password)
			data.ADMIN_PASSWORD = md5Lib.md5(password);

		// 4. 更新
		await AdminModel.edit(where, data);

		// 5. 记日志
		this.insertLog('修改了管理员【' + admin.ADMIN_NAME + '】', admin, LogModel.TYPE.SYS);
	}

	/** 修改自身密码 */
	async pwdtMgr(adminId, oldPassword, password) {
		// 1. 查是否存在
		let where = { _id: adminId };
		let admin = await AdminModel.getOne(where, 'ADMIN_NAME,ADMIN_PASSWORD');
		if (!admin)
			this.AppError('管理员不存在');

		// 2. 验证旧密码
		if (admin.ADMIN_PASSWORD !== md5Lib.md5(oldPassword))
			this.AppError('旧密码不正确');

		// 3. 更新为新密码
		await AdminModel.edit(where, { ADMIN_PASSWORD: md5Lib.md5(password) });

		// 4. 记日志
		this.insertLog('修改了登录密码', admin, LogModel.TYPE.SYS);
	}
}

module.exports = AdminMgrService;