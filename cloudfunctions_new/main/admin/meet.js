/**
 * admin/meet — 课程预约管理
 * 路由: admin/meet_*, admin/join_*, admin/self_checkin_qr
 */
const bcrypt = require('bcryptjs')
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time } = require('../common/util')
const { insertLog } = require('./_helper')

const SETUP_HOME_VOUCH_KEY = 'SETUP_HOME_VOUCH_KEY'

// ===== 课程 CRUD =====

async function getAdminMeetList(admin, params) {
    const { search, sortType, sortVal, page = 1, size = 20 } = params
    const where = {}

    if (search) where.MEET_TITLE = db.cmd().regex({ regexp: search, options: 'i' })
    if (sortType === 'status' && sortVal !== undefined) where.MEET_STATUS = Number(sortVal)
    if (sortType === 'cateId' && sortVal !== undefined) where.MEET_CATE_ID = sortVal

    let orderBy = { MEET_ORDER: 'asc' }
    if (sortType === 'sort' && sortVal === 'view') orderBy = { MEET_VIEW_CNT: 'desc' }

    const result = await db.getList('meet', where, {
        fields: 'MEET_CATE_ID,MEET_CATE_NAME,MEET_TITLE,MEET_STATUS,MEET_DAYS,MEET_ADD_TIME,MEET_EDIT_TIME,MEET_ORDER,MEET_VOUCH,MEET_QR',
        orderBy, page, size
    })
    return success(result)
}

async function insertMeet(admin, params) {
    const vResult = validate(params, {
        title: 'title|required|string|desc:标题',
        order: 'order|int|default:9999',
        cancelSet: 'cancelSet|int|default:1',
        cateId: 'cateId|required|string|desc:分类',
        cateName: 'cateName|required|string|desc:分类名',
        daysSet: 'daysSet|array|default:[]',
        phone: 'phone|string|default:""',
        password: 'password|string|min:6|max:30',
        forms: 'forms|array|default:[]',
        joinForms: 'joinForms|array|default:[]'
    })
    if (vResult.err) return vResult.err

    const { title, order, cancelSet, cateId, cateName, daysSet, phone, password, forms, joinForms } = vResult.data

    const data = {
        MEET_ADMIN_ID: admin._id,
        MEET_TITLE: title, MEET_ORDER: order, MEET_CANCEL_SET: cancelSet,
        MEET_CATE_ID: cateId, MEET_CATE_NAME: cateName,
        MEET_DAYS: daysSet, MEET_FORMS: forms, MEET_JOIN_FORMS: joinForms,
        MEET_PHONE: phone,
        MEET_PASSWORD: password ? await bcrypt.hash(password, 10) : '',
        MEET_STATUS: 1, MEET_VOUCH: 0
    }

    const id = await db.insert('meet', data)
    await syncDays(id, daysSet)

    insertLog(admin, '添加了课程【' + title + '】', 2)
    return success({ id })
}

async function getMeetDetail(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:课程ID' })
    if (vResult.err) return vResult.err

    const meet = await db.getOne('meet', { _id: vResult.data.id })
    if (!meet) return success(null)

    // 获取今天及以后的排期
    const today = timestamp2Time(time(), 'Y-M-D')
    const dayList = await db.getAll('day', {
        DAY_MEET_ID: vResult.data.id,
        day: db.cmd().gte(today)
    }, { orderBy: { field: 'day', direction: 'asc' }, limit: 365 })

    meet.MEET_DAYS_SET = dayList || []
    return success(meet)
}

async function editMeet(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:课程ID',
        title: 'title|required|string|desc:标题',
        cateId: 'cateId|required|string|desc:分类',
        cateName: 'cateName|required|string|desc:分类名',
        order: 'order|int|default:9999',
        cancelSet: 'cancelSet|int|default:1',
        daysSet: 'daysSet|array|default:[]',
        phone: 'phone|string|default:""',
        password: 'password|string|min:6|max:30',
        forms: 'forms|array|default:[]',
        joinForms: 'joinForms|array|default:[]'
    })
    if (vResult.err) return vResult.err

    const { id, title, cateId, cateName, order, cancelSet, daysSet, phone, password, forms, joinForms } = vResult.data

    const data = {
        MEET_TITLE: title, MEET_CATE_ID: cateId, MEET_CATE_NAME: cateName,
        MEET_ORDER: order, MEET_CANCEL_SET: cancelSet,
        MEET_DAYS: daysSet, MEET_FORMS: forms, MEET_JOIN_FORMS: joinForms
    }
    if (phone) data.MEET_PHONE = phone
    if (password) data.MEET_PASSWORD = await bcrypt.hash(password, 10)

    await db.edit('meet', { _id: id }, data)
    await syncDays(id, daysSet)

    insertLog(admin, '修改了课程【' + title + '】', 2)
    return success()
}

async function delMeet(admin, params) {
    const vResult = validate(params, { meetId: 'meetId|required|string|desc:课程ID' })
    if (vResult.err) return vResult.err

    await db.del('meet', { _id: vResult.data.meetId })
    insertLog(admin, '删除了课程', 2)
    return success()
}

async function statusMeet(admin, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string|desc:课程ID',
        status: 'status|required|int|desc:状态'
    })
    if (vResult.err) return vResult.err

    await db.edit('meet', { _id: vResult.data.meetId }, { MEET_STATUS: vResult.data.status })
    return success()
}

async function sortMeet(admin, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string|desc:课程ID',
        sort: 'sort|required|int|desc:排序值'
    })
    if (vResult.err) return vResult.err

    await db.edit('meet', { _id: vResult.data.meetId }, { MEET_ORDER: vResult.data.sort })
    return success()
}

async function vouchMeet(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:课程ID',
        vouch: 'vouch|required|int|desc:推荐状态'
    })
    if (vResult.err) return vResult.err

    await db.edit('meet', { _id: vResult.data.id }, { MEET_VOUCH: vResult.data.vouch })
    return success()
}

async function updateMeetForms(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:课程ID',
        hasImageForms: 'hasImageForms|array|default:[]'
    })
    if (vResult.err) return vResult.err

    await db.edit('meet', { _id: vResult.data.id }, { MEET_FORMS: vResult.data.hasImageForms, MEET_OBJ: {} })
    return success()
}

// ===== 排期管理 =====

async function getDayList(admin, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string|desc:课程ID',
        start: 'start|string|default:""',
        end: 'end|string|default:""'
    })
    if (vResult.err) return vResult.err

    const { meetId, start, end } = vResult.data
    const where = { DAY_MEET_ID: meetId }
    if (start && end) where.day = db.cmd().gte(start).and(db.cmd().lte(end))

    const list = await db.getAll('day', where, {
        fields: 'day,times,dayDesc',
        orderBy: { field: 'day', direction: 'asc' },
        limit: 365
    })
    return success(list || [])
}

async function setDays(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:课程ID',
        daysSet: 'daysSet|required|array|desc:排期设置'
    })
    if (vResult.err) return vResult.err

    const { id, daysSet } = vResult.data
    await db.edit('meet', { _id: id }, { MEET_DAYS: daysSet })
    await syncDays(id, daysSet)

    return success()
}

// 同步 Day 表
async function syncDays(meetId, daysSet) {
    const today = timestamp2Time(time(), 'Y-M-D')
    // 删除该课程今天的旧记录
    await db.del('day', { DAY_MEET_ID: meetId, day: db.cmd().lt(today) })

    for (const dayData of (daysSet || [])) {
        if (dayData.day >= today) {
            const exist = await db.getOne('day', { DAY_MEET_ID: meetId, day: dayData.day }, '_id')
            const record = {
                DAY_MEET_ID: meetId,
                day: dayData.day,
                dayDesc: dayData.dayDesc || '',
                times: dayData.times || []
            }
            if (exist) {
                await db.edit('day', { _id: exist._id }, record)
            } else {
                await db.insert('day', record)
            }
        }
    }
}

// ===== 预约管理 =====

async function getJoinList(admin, params) {
    const { meetId, mark, search, sortType, sortVal, page = 1, size = 20 } = params

    const where = { JOIN_MEET_ID: meetId }
    if (mark) where.JOIN_MEET_TIME_MARK = mark

    if (sortType === 'status' && sortVal !== undefined) {
        const sv = Number(sortVal)
        if (sv === 1099) {
            where.JOIN_STATUS = db.cmd().in([10, 99])
        } else {
            where.JOIN_STATUS = sv
        }
    }
    if (sortType === 'checkin' && sortVal !== undefined) {
        where.JOIN_STATUS = 1
        where.JOIN_IS_CHECKIN = Number(sortVal) === 1 ? 1 : 0
    }

    const result = await db.getList('join', where, {
        fields: 'JOIN_IS_CHECKIN,JOIN_CHECKIN_TIME,JOIN_CODE,JOIN_ID,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_STATUS,JOIN_ADD_TIME',
        orderBy: { JOIN_ADD_TIME: 'desc' }, page, size
    })
    return success(result)
}

async function statusJoin(admin, params) {
    const vResult = validate(params, {
        joinId: 'joinId|required|string|desc:预约ID',
        status: 'status|required|int|desc:状态',
        reason: 'reason|string|default:""'
    })
    if (vResult.err) return vResult.err

    const { joinId, status, reason } = vResult.data
    const data = { JOIN_STATUS: status }
    if (reason) data.JOIN_REASON = reason
    await db.edit('join', { _id: joinId }, data)
    return success()
}

async function delJoin(admin, params) {
    const vResult = validate(params, { joinId: 'joinId|required|string|desc:预约ID' })
    if (vResult.err) return vResult.err

    await db.del('join', { _id: vResult.data.joinId })
    return success()
}

async function scanJoin(admin, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string|desc:课程ID',
        code: 'code|required|string|desc:预约码'
    })
    if (vResult.err) return vResult.err

    const { meetId, code } = vResult.data
    const where = { JOIN_MEET_ID: meetId, JOIN_CODE: code }
    const join = await db.getOne('join', where, 'JOIN_ID,JOIN_IS_CHECKIN')
    if (!join) return fail(CODE.DATA, '预约码无效，未找到对应预约记录')
    if (join.JOIN_IS_CHECKIN) return fail(CODE.DATA, '该预约码已经核销过了')

    await db.edit('join', where, { JOIN_IS_CHECKIN: 1, JOIN_CHECKIN_TIME: time() })
    return success(join)
}

async function checkinJoin(admin, params) {
    const vResult = validate(params, {
        joinId: 'joinId|required|string|desc:预约ID',
        flag: 'flag|int|default:1'
    })
    if (vResult.err) return vResult.err

    const { joinId, flag } = vResult.data
    await db.edit('join', { _id: joinId }, {
        JOIN_IS_CHECKIN: flag ? 1 : 0,
        JOIN_CHECKIN_TIME: flag ? time() : 0
    })
    return success()
}

async function cancelJoinByTimeMark(admin, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string|desc:课程ID',
        timeMark: 'timeMark|required|string|desc:时段标识',
        reason: 'reason|string|default:"后台管理员取消"'
    })
    if (vResult.err) return vResult.err

    const { meetId, timeMark, reason } = vResult.data
    await db.edit('join', {
        JOIN_MEET_ID: meetId,
        JOIN_MEET_TIME_MARK: timeMark,
        JOIN_STATUS: 1
    }, {
        JOIN_STATUS: 10,
        JOIN_REASON: reason
    })
    return success()
}

// ===== 核销二维码 =====

async function genSelfCheckinQr(admin, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string|desc:课程ID'
    })
    if (vResult.err) return vResult.err

    try {
        const cloud = require('wx-server-sdk')
        const page = 'projects/workfit/pages/meet/join/meet_join'
        const result = await cloud.openapi.wxacode.getUnlimited({
            scene: vResult.data.meetId,
            width: 280,
            check_path: false,
            page
        })

        const crypto = require('crypto')
        const md5 = crypto.createHash('md5').update(vResult.data.meetId).digest('hex')
        const cloudPath = 'workfit/meet/' + md5 + '/qr.png'

        const upload = await cloud.uploadFile({ cloudPath, fileContent: result.buffer })
        if (!upload || !upload.fileID) return fail(CODE.SVR, '上传二维码失败')

        const tempRes = await cloud.getTempFileURL({ fileList: [upload.fileID] })
        const url = (tempRes.fileList && tempRes.fileList[0] && tempRes.fileList[0].tempFileURL) || ''
        return success(url + '?rd=' + time())
    } catch (e) {
        return fail(CODE.SVR, '生成核销码失败: ' + (e.message || e))
    }
}

// ===== 时段模板 =====

async function getMeetTempList(admin, params) {
    const meetId = (params && params.meetId) || 'admin'
    const list = await db.getAll('temp', { TEMP_MEET_ID: meetId }, {
        fields: 'TEMP_NAME,TEMP_TIMES',
        orderBy: { field: 'TEMP_ADD_TIME', direction: 'desc' },
        limit: 100
    })
    return success(list || [])
}

async function insertMeetTemp(admin, params) {
    const vResult = validate(params, {
        name: 'name|required|string|desc:模板名',
        times: 'times|array|default:[]',
        meetId: 'meetId|string|default:admin'
    })
    if (vResult.err) return vResult.err

    const { name, times, meetId } = vResult.data
    const id = await db.insert('temp', { TEMP_NAME: name, TEMP_TIMES: times, TEMP_MEET_ID: meetId })
    return success({ id })
}

async function delMeetTemp(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:模板ID' })
    if (vResult.err) return vResult.err

    await db.del('temp', { _id: vResult.data.id })
    return success()
}

async function editMeetTemp(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:模板ID',
        limit: 'limit|int|default:0',
        isLimit: 'isLimit|int|default:0',
        meetId: 'meetId|string|default:admin'
    })
    if (vResult.err) return vResult.err

    const { id, limit, isLimit } = vResult.data
    const temp = await db.getOne('temp', { _id: id }, 'TEMP_TIMES')
    if (!temp) return fail(CODE.DATA, '模板不存在')

    const times = (temp.TEMP_TIMES || []).map(t => ({ ...t, isLimit, limit }))
    await db.edit('temp', { _id: id }, { TEMP_TIMES: times })
    return success()
}

// ===== 导出 Excel（与旧版一致）=====

const EXPORT_JOIN_KEY = 'EXPORT_JOIN_DATA'

async function getJoinDataURL(admin, params) {
    const expData = await db.getOne('setup', { SETUP_KEY: EXPORT_JOIN_KEY }, 'SETUP_VALUE')
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

async function exportJoinData(admin, params) {
    const { meetId, startDay, endDay, status } = params || {}

    // 1. 查数据
    const where = { JOIN_MEET_ID: meetId }
    if (startDay) where.JOIN_MEET_DAY = db.cmd().gte(startDay).and(db.cmd().lte(endDay))
    if (status) where.JOIN_STATUS = Number(status)

    const list = await db.getAll('join', where, { limit: 10000 })

    // 2. 组装 Excel 数据
    const header = ['姓名', '手机', '课程', '日期', '时段', '状态', '预约时间']
    const dataArr = [header]
    for (const join of list) {
        const statusMap = { 1: '预约成功', 10: '已取消', 99: '系统取消' }
        dataArr.push([
            (join.JOIN_FORMS && join.JOIN_FORMS[0]) ? (join.JOIN_FORMS[0].val || '') : '',
            (join.JOIN_FORMS && join.JOIN_FORMS[1]) ? (join.JOIN_FORMS[1].val || '') : '',
            join.JOIN_MEET_TITLE || '',
            join.JOIN_MEET_DAY || '',
            (join.JOIN_MEET_TIME_START || '') + '~' + (join.JOIN_MEET_TIME_END || ''),
            statusMap[join.JOIN_STATUS] || '未知',
            join.JOIN_ADD_TIME ? timestamp2Time(join.JOIN_ADD_TIME) : ''
        ])
    }

    // 3. 生成 Excel
    const xlsx = require('node-xlsx')
    const buffer = xlsx.build([{ name: '预约数据' + timestamp2Time(time(), 'Y-M-D'), data: dataArr }])

    // 4. 上传云存储
    const crypto = require('crypto')
    const fileName = 'JOIN_' + crypto.createHash('md5').update(EXPORT_JOIN_KEY + meetId).digest('hex') + '.xlsx'
    const cloudPath = 'workfit/export/' + fileName

    const cloud = require('wx-server-sdk')
    const upload = await cloud.uploadFile({ cloudPath, fileContent: buffer })
    if (!upload || !upload.fileID) return fail(CODE.SVR, '上传Excel失败')

    // 5. 保存导出记录到 setup
    const exportRecord = {
        EXPORT_ADD_TIME: time(),
        EXPORT_KEY: EXPORT_JOIN_KEY,
        EXPORT_CLOUD_ID: upload.fileID
    }
    await upsertSetup(EXPORT_JOIN_KEY, exportRecord, 'export')

    return success({ total: list.length })
}

async function deleteJoinData(admin, params) {
    const expData = await db.getOne('setup', { SETUP_KEY: EXPORT_JOIN_KEY }, 'SETUP_VALUE')
    if (!expData || !expData.SETUP_VALUE || !expData.SETUP_VALUE.val) return success()

    const cloudId = expData.SETUP_VALUE.val.EXPORT_CLOUD_ID
    if (cloudId) {
        try {
            const cloud = require('wx-server-sdk')
            await cloud.deleteFile({ fileList: [cloudId] })
        } catch (_) {}
    }

    await db.del('setup', { SETUP_KEY: EXPORT_JOIN_KEY })
    return success()
}

// 辅助：upsert setup
async function upsertSetup(key, val, type = '') {
    const exist = await db.coll('setup').where({ SETUP_KEY: key }).get()
    if (exist.data && exist.data.length > 0) {
        await db.edit('setup', { SETUP_KEY: key }, { SETUP_VALUE: { val }, SETUP_TYPE: type })
    } else {
        await db.insert('setup', { SETUP_KEY: key, SETUP_VALUE: { val }, SETUP_TYPE: type })
    }
}

module.exports = {
    getAdminMeetList, insertMeet, getMeetDetail, editMeet, delMeet,
    statusMeet, sortMeet, vouchMeet, updateMeetForms,
    getDayList, setDays,
    getJoinList, statusJoin, delJoin, scanJoin, checkinJoin, cancelJoinByTimeMark,
    genSelfCheckinQr,
    getMeetTempList, insertMeetTemp, delMeetTemp, editMeetTemp,
    getJoinDataURL, exportJoinData, deleteJoinData
}
