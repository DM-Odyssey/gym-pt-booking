/**
 * admin/user — 用户管理
 */
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time } = require('../common/util')
const { insertLog } = require('./_helper')

async function getUserList(admin, params) {
    const { search, sortType, sortVal, page = 1, size = 20 } = params
    const where = {}

    if (search) {
        where.or = [
            { USER_NAME: db.cmd().regex({ regexp: search, options: 'i' }) },
            { USER_MOBILE: db.cmd().regex({ regexp: search, options: 'i' }) },
            { USER_MEMO: db.cmd().regex({ regexp: search, options: 'i' }) }
        ]
    }
    if (sortType === 'status' && sortVal !== undefined) where.USER_STATUS = Number(sortVal)

    const result = await db.getList('user', where, {
        orderBy: { USER_ADD_TIME: 'desc' }, page, size
    })
    return success(result)
}

async function getUserDetail(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:用户ID' })
    if (vResult.err) return vResult.err

    const user = await db.getOne('user', { USER_MINI_OPENID: vResult.data.id })
    return success(user || null)
}

async function delUser(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:用户ID' })
    if (vResult.err) return vResult.err

    const where = { USER_MINI_OPENID: vResult.data.id }
    const user = await db.getOne('user', where)
    if (!user) return fail(CODE.DATA, '用户不存在')

    await db.del('user', where)
    insertLog(admin, '删除了用户【' + user.USER_NAME + '】', 1)
    return success()
}

async function statusUser(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:用户ID',
        status: 'status|required|int|desc:状态',
        reason: 'reason|string|default:""'
    })
    if (vResult.err) return vResult.err

    const { id, status, reason } = vResult.data
    const where = { USER_MINI_OPENID: id }

    const user = await db.getOne('user', where)
    if (!user) return fail(CODE.DATA, '用户不存在')

    const data = { USER_STATUS: status }
    if (reason) data.USER_CHECK_REASON = reason
    await db.edit('user', where, data)

    const statusMap = { 0: '待审核', 1: '正常', 8: '审核未通过', 9: '禁用' }
    insertLog(admin, (statusMap[status] || '修改') + '了用户【' + user.USER_NAME + '】', 1)
    return success()
}

// ===== 用户数据导出 =====

const EXPORT_USER_KEY = 'EXPORT_USER_DATA'

async function getUserDataURL(admin, params) {
    const expData = await db.getOne('setup', { SETUP_KEY: EXPORT_USER_KEY }, 'SETUP_VALUE')
    let url = '', timeStr = ''

    if (expData && expData.SETUP_VALUE && expData.SETUP_VALUE.val) {
        const val = expData.SETUP_VALUE.val
        try {
            const cloud = require('wx-server-sdk')
            const tempRes = await cloud.getTempFileURL({ fileList: [val.EXPORT_CLOUD_ID] })
            url = (tempRes.fileList && tempRes.fileList[0] && tempRes.fileList[0].tempFileURL) || ''
            if (url) url += '?rd=' + time()
            timeStr = val.EXPORT_ADD_TIME ? timestamp2Time(val.EXPORT_ADD_TIME) : ''
        } catch (_) {}
    }

    return success({ url, time: timeStr })
}

async function exportUserData(admin, params) {
    const { condition, fields } = params || {}

    // 1. 解析查询条件
    let where = {}
    try {
        if (condition) where = JSON.parse(decodeURIComponent(condition))
    } catch (_) {}

    // 2. 查所有匹配用户
    const list = await db.getAll('user', where, { limit: 10000 })

    // 3. 组装 Excel
    const header = fields && fields.length ? fields : ['姓名', '手机', '状态', '注册时间']
    const dataArr = [header]
    for (const user of list) {
        const statusMap = { 0: '待审核', 1: '正常', 8: '审核未通过', 9: '禁用' }
        dataArr.push([
            user.USER_NAME || '',
            user.USER_MOBILE || '',
            statusMap[user.USER_STATUS] || '',
            user.USER_ADD_TIME ? timestamp2Time(user.USER_ADD_TIME) : ''
        ])
    }

    // 4. 生成 Excel 上传
    const xlsx = require('node-xlsx')
    const buffer = xlsx.build([{ name: '用户数据' + timestamp2Time(time(), 'Y-M-D'), data: dataArr }])

    const crypto = require('crypto')
    const fileName = 'USER_' + crypto.createHash('md5').update(EXPORT_USER_KEY).digest('hex') + '.xlsx'
    const cloudPath = 'workfit/export/' + fileName

    const cloud = require('wx-server-sdk')
    const upload = await cloud.uploadFile({ cloudPath, fileContent: buffer })
    if (!upload || !upload.fileID) return fail(CODE.SVR, '上传Excel失败')

    // 5. 保存记录
    const exportRecord = {
        EXPORT_ADD_TIME: time(),
        EXPORT_KEY: EXPORT_USER_KEY,
        EXPORT_CLOUD_ID: upload.fileID
    }
    const exist = await db.coll('setup').where({ SETUP_KEY: EXPORT_USER_KEY }).get()
    if (exist.data && exist.data.length > 0) {
        await db.edit('setup', { SETUP_KEY: EXPORT_USER_KEY }, { SETUP_VALUE: { val: exportRecord }, SETUP_TYPE: 'export' })
    } else {
        await db.insert('setup', { SETUP_KEY: EXPORT_USER_KEY, SETUP_VALUE: { val: exportRecord }, SETUP_TYPE: 'export' })
    }

    return success({ total: list.length })
}

async function deleteUserData(admin, params) {
    const expData = await db.getOne('setup', { SETUP_KEY: EXPORT_USER_KEY }, 'SETUP_VALUE')
    if (!expData || !expData.SETUP_VALUE || !expData.SETUP_VALUE.val) return success()

    const cloudId = expData.SETUP_VALUE.val.EXPORT_CLOUD_ID
    if (cloudId) {
        try {
            const cloud = require('wx-server-sdk')
            await cloud.deleteFile({ fileList: [cloudId] })
        } catch (_) {}
    }

    await db.del('setup', { SETUP_KEY: EXPORT_USER_KEY })
    return success()
}

module.exports = { getUserList, getUserDetail, delUser, statusUser, getUserDataURL, exportUserData, deleteUserData }
