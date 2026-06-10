/**
 * 身份认证模块
 * 依赖：调用前需先执行 db.init(env)
 */

const cloud = require('wx-server-sdk')
const { coll } = require('./db')
const { time, isDefined } = require('./util')
const { fail, CODE } = require('./response')

// Token 有效期（秒）
const ADMIN_TOKEN_EXPIRE = 86400  // 24小时
const WORK_TOKEN_EXPIRE = 86400   // 24小时

const getCmd = () => cloud.database().command

/**
 * 验证管理员 token
 */
async function checkAdmin(token) {
    if (!isDefined(token) || token === '') {
        return { err: fail(CODE.ADMIN_ERROR, '未登录，请先登录后台') }
    }

    const result = await coll('admin').where({
        ADMIN_TOKEN: token,
        ADMIN_TOKEN_TIME: getCmd().gt(time() - ADMIN_TOKEN_EXPIRE),
        ADMIN_STATUS: 1
    }).field({ ADMIN_ID: true, ADMIN_NAME: true, ADMIN_TYPE: true, ADMIN_DESC: true }).get()

    if (!result.data || result.data.length === 0) {
        return { err: fail(CODE.ADMIN_ERROR, '登录已过期，请重新登录') }
    }

    return { admin: result.data[0] }
}

/**
 * 验证教练/work token
 */
async function checkWork(token) {
    if (!isDefined(token) || token === '') {
        return { err: fail(CODE.WORK_ERROR, '未登录，请先登录教练端') }
    }

    const result = await coll('meet').where({
        MEET_TOKEN: token,
        MEET_TOKEN_TIME: getCmd().gt(time() - WORK_TOKEN_EXPIRE)
    }).get()

    if (!result.data || result.data.length === 0) {
        return { err: fail(CODE.WORK_ERROR, '登录已过期，请重新登录') }
    }

    const meet = result.data[0]
    return {
        work: {
            _id: meet._id,
            MEET_ID: meet.MEET_ID,
            MEET_TITLE: meet.MEET_TITLE,
            MEET_PHONE: meet.MEET_PHONE
        }
    }
}

module.exports = { checkAdmin, checkWork }
