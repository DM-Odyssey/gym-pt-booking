/**
 * 管理员登录 + 仪表盘 + 管理员 CRUD
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */
const bcrypt = require('bcryptjs')
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time, genRandomString } = require('../common/util')
const { insertLog } = require('./_helper')

const SETUP_HOME_VOUCH_KEY = 'SETUP_HOME_VOUCH_KEY'

// ===== 登录 =====

async function adminLogin(params) {
    const vResult = validate(params, {
        name: 'name|required|string|min:5|max:30|desc:账号',
        pwd: 'pwd|required|string|min:5|max:30|desc:密码'
    })
    if (vResult.err) return vResult.err

    const { name, pwd: password } = vResult.data

    const where = { ADMIN_NAME: name, ADMIN_STATUS: 1 }
    const admin = await db.getOne('admin', where)
    if (!admin) return fail(CODE.ADMIN_ERROR, '管理员不存在或已停用')

    // 密码验证：兼容 MD5 旧数据，自动升级 bcrypt
    const storedPwd = admin.ADMIN_PASSWORD
    let pwdOk = false

    if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
        pwdOk = await bcrypt.compare(password, storedPwd)
    } else {
        const crypto = require('crypto')
        const md5Hash = crypto.createHash('md5').update(password).digest('hex')
        if (storedPwd === md5Hash) {
            pwdOk = true
            const newHash = await bcrypt.hash(password, 10)
            await db.edit('admin', where, { ADMIN_PASSWORD: newHash }).catch(() => {})
        }
    }

    if (!pwdOk) return fail(CODE.ADMIN_ERROR, '管理员不存在或已停用')

    const token = genRandomString(32)
    const tokenTime = time()
    const cnt = (admin.ADMIN_LOGIN_CNT || 0) + 1

    await db.edit('admin', where, {
        ADMIN_TOKEN: token,
        ADMIN_TOKEN_TIME: tokenTime,
        ADMIN_LOGIN_TIME: tokenTime,
        ADMIN_LOGIN_CNT: cnt
    })

    insertLog(admin, '登录了系统', 0)

    return success({
        token,
        name: admin.ADMIN_NAME,
        type: admin.ADMIN_TYPE || 0,
        last: admin.ADMIN_LOGIN_TIME ? timestamp2Time(admin.ADMIN_LOGIN_TIME) : '尚未登录',
        cnt: cnt - 1
    })
}

// ===== 仪表盘 =====

async function adminHome(admin, params) {
    const [userCnt, newsCnt, meetCnt] = await Promise.all([
        db.count('user', {}),
        db.count('news', {}),
        db.count('meet', {})
    ])
    return success([
        { title: '用户数', cnt: userCnt },
        { title: '资讯数', cnt: newsCnt },
        { title: '预约项目', cnt: meetCnt }
    ])
}

async function clearVouch(admin, params) {
    await db.del('setup', { SETUP_KEY: SETUP_HOME_VOUCH_KEY })
    await db.edit('news', {}, { NEWS_VOUCH: 0 })
    await db.edit('meet', {}, { MEET_VOUCH: 0 })
    insertLog(admin, '清除了首页推荐数据', 0)
    return success()
}

// ===== 管理员 CRUD =====

async function getMgrList(admin, params) {
    const { search, sortType, sortVal, page = 1, size = 20 } = params
    const where = {}

    if (search) {
        where.or = [
            { ADMIN_NAME: db.regexp(search) },
            { ADMIN_PHONE: db.regexp(search) },
            { ADMIN_DESC: db.regexp(search) }
        ]
    }
    if (sortType === 'status' && sortVal !== undefined) where.ADMIN_STATUS = Number(sortVal)
    if (sortType === 'type' && sortVal !== undefined) where.ADMIN_TYPE = Number(sortVal)

    const result = await db.getList('admin', where, {
        fields: 'ADMIN_NAME,ADMIN_STATUS,ADMIN_PHONE,ADMIN_TYPE,ADMIN_LOGIN_CNT,ADMIN_LOGIN_TIME,ADMIN_DESC,ADMIN_EDIT_TIME,ADMIN_EDIT_IP',
        orderBy: { ADMIN_ADD_TIME: 'desc' },
        page, size
    })
    if (result.list) {
        result.list = result.list.map(item => ({
            ...item,
            ADMIN_LOGIN_TIME: item.ADMIN_LOGIN_TIME ? timestamp2Time(item.ADMIN_LOGIN_TIME) : '',
            ADMIN_EDIT_TIME: item.ADMIN_EDIT_TIME ? timestamp2Time(item.ADMIN_EDIT_TIME) : ''
        }))
    }
    return success(result)
}

async function insertMgr(admin, params) {
    const vResult = validate(params, {
        name: 'name|required|string|desc:账号',
        desc: 'desc|string|default:""',
        phone: 'phone|string|default:""',
        password: 'password|required|string|min:6|max:30|desc:密码'
    })
    if (vResult.err) return vResult.err

    const { name, desc, phone, password } = vResult.data

    const exists = await db.getOne('admin', { ADMIN_NAME: name })
    if (exists) return fail(CODE.DATA, '该账号已存在')

    const hash = await bcrypt.hash(password, 10)
    await db.insert('admin', {
        ADMIN_NAME: name, ADMIN_DESC: desc, ADMIN_PHONE: phone,
        ADMIN_PASSWORD: hash, ADMIN_STATUS: 1, ADMIN_TYPE: 0
    })

    insertLog(admin, '添加了管理员【' + name + '】', 0)
    return success()
}

async function delMgr(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:管理员ID' })
    if (vResult.err) return vResult.err

    const where = { _id: vResult.data.id }
    const mgr = await db.getOne('admin', where)
    if (!mgr) return fail(CODE.DATA, '管理员不存在')

    await db.del('admin', where)
    insertLog(admin, '删除了管理员【' + mgr.ADMIN_NAME + '】', 0)
    return success()
}

async function getMgrDetail(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:管理员ID' })
    if (vResult.err) return vResult.err

    const mgr = await db.getOne('admin', { _id: vResult.data.id })
    return success(mgr || null)
}

async function editMgr(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:管理员ID',
        name: 'name|required|string|desc:账号',
        desc: 'desc|string|default:""',
        phone: 'phone|string|default:""',
        password: 'password|string'
    })
    if (vResult.err) return vResult.err

    const { id, name, desc, phone, password } = vResult.data
    const where = { _id: id }

    const mgr = await db.getOne('admin', where)
    if (!mgr) return fail(CODE.DATA, '管理员不存在')

    const exist = await db.getOne('admin', { ADMIN_NAME: name, _id: db.neq(id) })
    if (exist) return fail(CODE.DATA, '该账号名已被其他管理员使用')

    const data = { ADMIN_NAME: name, ADMIN_DESC: desc, ADMIN_PHONE: phone }
    if (password) data.ADMIN_PASSWORD = await bcrypt.hash(password, 10)

    await db.edit('admin', where, data)
    insertLog(admin, '修改了管理员【' + mgr.ADMIN_NAME + '】', 0)
    return success()
}

async function statusMgr(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:管理员ID',
        status: 'status|required|int|desc:状态'
    })
    if (vResult.err) return vResult.err

    const { id, status } = vResult.data
    const where = { _id: id }

    const mgr = await db.getOne('admin', where)
    if (!mgr) return fail(CODE.DATA, '管理员不存在')

    await db.edit('admin', where, { ADMIN_STATUS: status })
    insertLog(admin, (status === 1 ? '启用' : '禁用') + '了管理员【' + mgr.ADMIN_NAME + '】', 0)
    return success()
}

async function pwdMgr(admin, params) {
    const vResult = validate(params, {
        oldPassword: 'oldPassword|required|string|desc:旧密码',
        password: 'password|required|string|min:6|max:30|desc:新密码'
    })
    if (vResult.err) return vResult.err

    const { oldPassword, password } = vResult.data

    const storedPwd = admin.ADMIN_PASSWORD
    let pwdOk = false

    if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
        pwdOk = await bcrypt.compare(oldPassword, storedPwd)
    } else {
        const crypto = require('crypto')
        pwdOk = storedPwd === crypto.createHash('md5').update(oldPassword).digest('hex')
    }

    if (!pwdOk) return fail(CODE.DATA, '旧密码不正确')

    const newHash = await bcrypt.hash(password, 10)
    await db.edit('admin', { _id: admin._id }, { ADMIN_PASSWORD: newHash })
    insertLog(admin, '修改了登录密码', 0)
    return success()
}

// ===== 系统初始化（首次部署） =====

async function adminInit(params) {
    const results = []
    try {
        await db.ensureAdmin()
        results.push('管理员初始化完成')
    } catch (e) {
        results.push('管理员初始化失败: ' + e.message)
    }
    try {
        await db.seedData()
        results.push('种子数据初始化完成')
    } catch (e) {
        results.push('种子数据初始化失败: ' + e.message)
    }
    return success({ msg: results.join('；') })
}

async function checkInit(params) {
    const cnt = await db.count('admin', {})
    return success({ initialized: cnt > 0 })
}

module.exports = { adminLogin, adminInit, checkInit, adminHome, clearVouch, getMgrList, insertMgr, delMgr, getMgrDetail, editMgr, statusMgr, pwdMgr }
