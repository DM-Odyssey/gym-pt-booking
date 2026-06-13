/**
 * 通行证 — 微信登录/注册/手机号/用户资料
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const cloud = require('wx-server-sdk')
const db = require('../common/db')
const { success, fail, CODE } = require('../common/response')
const { time, makeID, timestamp2Time } = require('../common/util')
const { validate } = require('../common/validate')

async function login(openId, params) {
    const where = { USER_MINI_OPENID: openId }
    const user = await db.getOne('user', where, 'USER_ID,USER_MINI_OPENID,USER_NAME,USER_STATUS')

    let token = null
    if (user) {
        token = {
            id: user.USER_MINI_OPENID,
            key: user.USER_ID,
            name: user.USER_NAME,
            status: user.USER_STATUS
        }
        const cnt = (user.USER_LOGIN_CNT || 0) + 1
        db.edit('user', where, { USER_LOGIN_TIME: time(), USER_LOGIN_CNT: cnt })
    }

    return success({ token })
}

async function register(openId, params) {
    const result = validate(params, {
        name: 'name|string|required|min:1|max:30|desc:昵称',
        mobile: 'mobile|string|required|len:11|desc:手机号',
        forms: 'forms|array|default:[]',
    })
    if (result.err) return result.err

    const { name, mobile, forms } = result.data

    const existUser = await db.getOne('user', { USER_MINI_OPENID: openId }, '_id')
    if (existUser) return await login(openId)

    const existMobile = await db.getOne('user', { USER_MOBILE: mobile }, '_id')
    if (existMobile) return fail(CODE.LOGIC, '该手机号已注册')

    await db.insert('user', {
        USER_ID: makeID(),
        USER_MINI_OPENID: openId,
        USER_MOBILE: mobile,
        USER_NAME: name,
        USER_FORMS: forms,
        USER_STATUS: 1,
    })

    return await login(openId)
}

async function getPhone(openId, params) {
    const result = validate(params, { cloudID: 'cloudID|string|required|min:1|desc:cloudID' })
    if (result.err) return result.err

    try {
        const res = await cloud.getOpenData({ list: [result.data.cloudID] })
        return success(res?.list?.[0]?.data?.phoneNumber || '')
    } catch (e) {
        return success('')
    }
}

async function getMyDetail(openId, params) {
    const user = await db.getOne('user',
        { USER_MINI_OPENID: openId },
        'USER_MOBILE,USER_NAME,USER_FORMS,USER_STATUS,USER_CHECK_REASON'
    )
    return success(user || {})
}

async function editBase(openId, params) {
    const result = validate(params, {
        name: 'name|string|required|min:1|max:30|desc:昵称',
        mobile: 'mobile|string|required|len:11|desc:手机号',
        forms: 'forms|array|default:[]',
    })
    if (result.err) return result.err

    const { name, mobile, forms } = result.data
    const where = { USER_MINI_OPENID: openId }
    const user = await db.getOne('user', where, '_id,USER_STATUS')
    if (!user) return fail(CODE.LOGIC, '用户不存在')

    const dup = await db.getOne('user', { USER_MOBILE: mobile }, '_id')
    if (dup && dup._id !== user._id) return fail(CODE.LOGIC, '该手机号已被其他用户注册')

    const data = { USER_MOBILE: mobile, USER_NAME: name, USER_FORMS: forms }
    if (user.USER_STATUS === 0 || user.USER_STATUS === 8) data.USER_STATUS = 1

    await db.edit('user', where, data)
    return success()
}

// ===== 健身卡查询 =====

async function getMyCard(openId, params) {
    const today = timestamp2Time(time(), 'Y-M-D')
    const cards = await db.getAll('card', {
        CARD_USER_ID: openId
    }, { orderBy: { field: 'CARD_ADD_TIME', direction: 'desc' }, limit: 20 })

    // 实时判断过期 + 格式化（代码层过滤状态，避免 cmd.in 兼容问题）
    const validCards = []
    let totalCoach = 0, totalCourse = 0, totalGeneral = 0

    for (const card of cards) {
        // 跳过已作废的卡
        if (card.CARD_STATUS === 99) continue

        const remaining = Math.max(0, (card.CARD_TOTAL || 0) - (card.CARD_USED || 0))
        const isExpired = card.CARD_EXPIRE && card.CARD_EXPIRE < today

        const cardInfo = {
            id: card._id,
            type: card.CARD_TYPE,
            typeName: { 1: '私教卡', 2: '课程卡', 3: '健身卡' }[card.CARD_TYPE] || '',
            total: card.CARD_TOTAL || 0,
            used: card.CARD_USED || 0,
            remain: isExpired ? 0 : remaining,
            expire: card.CARD_EXPIRE || '',
            status: isExpired ? 9 : (card.CARD_STATUS || 1),
            statusName: isExpired ? '已过期' : (remaining <= 0 ? '已用完' : '有效'),
            memo: card.CARD_MEMO || ''
        }

        validCards.push(cardInfo)

        if (cardInfo.status === 1 && remaining > 0) {
            if (card.CARD_TYPE === 1) totalCoach += remaining
            else if (card.CARD_TYPE === 2) totalCourse += remaining
            else if (card.CARD_TYPE === 3) totalGeneral += remaining
        }
    }

    return success({
        cards: validCards,
        totalRemain: {
            coach: totalCoach,
            course: totalCourse,
            general: totalGeneral
        }
    })
}

module.exports = { login, register, getPhone, getMyDetail, editBase, getMyCard }
