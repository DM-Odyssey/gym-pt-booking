/**
 * 通行证模块 — 微信登录/注册/手机号/用户资料
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const cloud = require('wx-server-sdk')
const db = require('../common/db')
const { success, fail, CODE } = require('../common/response')
const { time, makeID } = require('../common/util')
const { validate } = require('../common/validate')

async function handle(route, openId, params) {
    switch (route) {
        case 'passport/login':
            return await login(openId)
        case 'passport/register':
            return await register(openId, params)
        case 'passport/phone':
            return await getPhone(params)
        case 'passport/my_detail':
            return await getMyDetail(openId)
        case 'passport/edit_base':
            return await editBase(openId, params)
        default:
            return fail(CODE.LOGIC, '未知路由: ' + route)
    }
}

// ===== 登录 =====
async function login(userId) {
    const where = { USER_MINI_OPENID: userId }
    const user = await db.getOne('user', where, 'USER_ID,USER_MINI_OPENID,USER_NAME,USER_STATUS')

    let token = null
    if (user) {
        token = {
            id: user.USER_MINI_OPENID,
            key: user.USER_ID,
            name: user.USER_NAME,
            status: user.USER_STATUS
        }
        // 更新登录时间和次数
        const cnt = (user.USER_LOGIN_CNT || 0) + 1
        db.edit('user', where, { USER_LOGIN_TIME: time(), USER_LOGIN_CNT: cnt })
    }

    return success({ token })
}

// ===== 注册 =====
async function register(userId, params) {
    const result = validate(params, {
        name: 'name|string|required|min:1|max:30|desc:昵称',
        mobile: 'mobile|string|required|len:11|desc:手机号',
        forms: 'forms|array|default:[]',
    })
    if (result.err) return result.err

    const { name, mobile, forms } = result.data

    // 是否已注册
    const existUser = await db.getOne('user', { USER_MINI_OPENID: userId }, '_id')
    if (existUser) {
        return await login(userId)
    }

    // 手机号唯一
    const existMobile = await db.getOne('user', { USER_MOBILE: mobile }, '_id')
    if (existMobile) return fail(CODE.LOGIC, '该手机号已注册')

    await db.insert('user', {
        USER_ID: makeID(),
        USER_MINI_OPENID: userId,
        USER_MOBILE: mobile,
        USER_NAME: name,
        USER_FORMS: forms,
        USER_STATUS: 1,
    })

    return await login(userId)
}

// ===== 获取手机号 =====
async function getPhone(params) {
    const result = validate(params, { cloudID: 'cloudID|string|required|min:1|desc:cloudID' })
    if (result.err) return result.err

    try {
        const res = await cloud.getOpenData({ list: [result.data.cloudID] })
        return success(res?.list?.[0]?.data?.phoneNumber || '')
    } catch (e) {
        return success('')
    }
}

// ===== 我的详情 =====
async function getMyDetail(userId) {
    const user = await db.getOne('user',
        { USER_MINI_OPENID: userId },
        'USER_MOBILE,USER_NAME,USER_FORMS,USER_STATUS,USER_CHECK_REASON'
    )
    return success(user || {})
}

// ===== 编辑资料 =====
async function editBase(userId, params) {
    const result = validate(params, {
        name: 'name|string|required|min:1|max:30|desc:昵称',
        mobile: 'mobile|string|required|len:11|desc:手机号',
        forms: 'forms|array|default:[]',
    })
    if (result.err) return result.err

    const { name, mobile, forms } = result.data

    const where = { USER_MINI_OPENID: userId }
    const user = await db.getOne('user', where, '_id,USER_STATUS')
    if (!user) return fail(CODE.LOGIC, '用户不存在')

    // 手机号唯一检查
    const dup = await db.getOne('user', { USER_MOBILE: mobile }, '_id')
    if (dup && dup._id !== user._id) return fail(CODE.LOGIC, '该手机号已被其他用户注册')

    const data = { USER_MOBILE: mobile, USER_NAME: name, USER_FORMS: forms }

    // 状态转换：如果之前是待审核，编辑后重置为待处理
    if (user.USER_STATUS === 0 || user.USER_STATUS === 8) {
        data.USER_STATUS = 1
    }

    await db.edit('user', where, data)
    return success()
}

module.exports = { handle }
