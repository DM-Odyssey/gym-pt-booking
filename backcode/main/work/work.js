/**
 * 教练端 — 登录/资料/排期/核销
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */
const bcrypt = require('bcryptjs')
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time, genRandomString } = require('../common/util')

async function login(params) {
    const vResult = validate(params, {
        phone: 'phone|required|string|desc:手机号',
        pwd: 'pwd|required|string|min:5|max:30|desc:密码'
    })
    if (vResult.err) return vResult.err

    const { phone, pwd: password } = vResult.data
    const where = { MEET_PHONE: phone, MEET_STATUS: 1 }
    const meet = await db.getOne('meet', where)
    if (!meet) return fail(CODE.LOGIC, '账号或密码错误')

    const storedPwd = meet.MEET_PASSWORD
    let pwdOk = false
    if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
        pwdOk = await bcrypt.compare(password, storedPwd)
    } else {
        const crypto = require('crypto')
        pwdOk = storedPwd === crypto.createHash('md5').update(password).digest('hex')
    }
    if (!pwdOk) return fail(CODE.LOGIC, '账号或密码错误')

    const token = genRandomString(32)
    const tokenTime = time()
    const cnt = (meet.MEET_LOGIN_CNT || 0) + 1

    await db.edit('meet', where, {
        MEET_MINI_OPENID: meet.MEET_MINI_OPENID || '',
        MEET_TOKEN: token, MEET_TOKEN_TIME: tokenTime,
        MEET_LOGIN_TIME: tokenTime, MEET_LOGIN_CNT: cnt
    })

    return success({
        id: meet._id, token,
        name: meet.MEET_TITLE,
        last: meet.MEET_LOGIN_TIME ? timestamp2Time(meet.MEET_LOGIN_TIME) : '尚未登录',
        cnt: cnt - 1,
        pic: (meet.MEET_OBJ && meet.MEET_OBJ.cover && meet.MEET_OBJ.cover[0]) || ''
    })
}

async function home(work, params) {
    const today = timestamp2Time(time(), 'Y-M-D')
    const dayList = await db.getAll('day', { DAY_MEET_ID: work._id, day: db.cmd().gte(today) }, { fields: 'day', limit: 365 })
    return success({ dayCnt: dayList.length })
}

async function pwd(work, params) {
    const vResult = validate(params, {
        oldPassword: 'oldPassword|required|string|desc:旧密码',
        password: 'password|required|string|min:6|max:30|desc:新密码'
    })
    if (vResult.err) return vResult.err

    const meet = await db.getOne('meet', { _id: work._id }, 'MEET_PASSWORD')
    const storedPwd = meet.MEET_PASSWORD
    let pwdOk = false
    if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
        pwdOk = await bcrypt.compare(vResult.data.oldPassword, storedPwd)
    } else {
        const crypto = require('crypto')
        pwdOk = storedPwd === crypto.createHash('md5').update(vResult.data.oldPassword).digest('hex')
    }
    if (!pwdOk) return fail(CODE.DATA, '旧密码不正确')

    const newHash = await bcrypt.hash(vResult.data.password, 10)
    await db.edit('meet', { _id: work._id }, { MEET_PASSWORD: newHash })
    return success()
}

async function meetDetail(work, params) {
    const meet = await db.getOne('meet', { _id: work._id })
    if (!meet) return success(null)

    // 读取排期数据，对齐 admin meet_detail 返回 MEET_DAYS_SET
    const today = timestamp2Time(time(), 'Y-M-D')
    const dayList = await db.getAll('day', {
        DAY_MEET_ID: work._id,
        day: db.cmd().gte(today)
    }, { orderBy: { field: 'day', direction: 'asc' }, limit: 365 })

    meet.MEET_DAYS_SET = (dayList && dayList.length > 0) ? dayList : (meet.MEET_DAYS || [])
    return success(meet)
}

async function meetEdit(work, params) {
    const vResult = validate(params, {
        id: 'id|required|string',
        title: 'title|required|string|desc:标题',
        cateId: 'cateId|required|string|desc:分类',
        cateName: 'cateName|required|string|desc:分类名',
        order: 'order|int|default:9999',
        cancelSet: 'cancelSet|int|default:1',
        daysSet: 'daysSet|array|default:[]',
        phone: 'phone|string|default:""',
        password: 'password|string',
        forms: 'forms|array|default:[]',
        joinForms: 'joinForms|array|default:[]',
        costMode: 'costMode|int|default:0'
    })
    if (vResult.err) return vResult.err

    const { id, title, cateId, cateName, order, cancelSet, daysSet, phone, password, forms, joinForms, costMode } = vResult.data
    if (id !== work._id.toString()) return fail(CODE.LOGIC, '只能编辑自己的课程')

    const data = {
        MEET_TITLE: title, MEET_CATE_ID: cateId, MEET_CATE_NAME: cateName,
        MEET_ORDER: order, MEET_CANCEL_SET: cancelSet,
        MEET_DAYS: daysSet, MEET_FORMS: forms, MEET_JOIN_FORMS: joinForms,
        MEET_OBJ: forms2Obj(forms),
        MEET_COST_MODE: costMode || 0
    }
    if (phone) data.MEET_PHONE = phone
    if (password) data.MEET_PASSWORD = await bcrypt.hash(password, 10)

    await db.edit('meet', { _id: id }, data)
    await syncDays(id, daysSet)
    return success()
}

async function meetUpdateForms(work, params) {
    const { id, hasImageForms } = params || {}
    if (!hasImageForms || hasImageForms.length === 0) return success()

    const meet = await db.getOne('meet', { _id: id }, 'MEET_FORMS')
    const currentForms = (meet && meet.MEET_FORMS) ? meet.MEET_FORMS : []
    for (const updated of hasImageForms) {
        const idx = currentForms.findIndex(f => f.mark === updated.mark)
        if (idx >= 0) currentForms[idx] = updated
        else currentForms.push(updated)
    }
    await db.edit('meet', { _id: id }, { MEET_FORMS: currentForms, MEET_OBJ: forms2Obj(currentForms) })
    return success()
}

async function dayList(work, params) {
    const { meetId, start, end } = params || {}
    const where = { DAY_MEET_ID: meetId || work._id }
    if (start && end) where.day = db.cmd().gte(start).and(db.cmd().lte(end))
    const list = await db.getAll('day', where, {
        fields: 'day,times,dayDesc', orderBy: { field: 'day', direction: 'asc' }, limit: 365
    })
    return success(list || [])
}

async function joinList(work, params) {
    const { meetId, mark, page = 1, size = 20, sortType, sortVal } = params
    const where = { JOIN_MEET_ID: meetId || work._id }
    if (mark) where.JOIN_MEET_TIME_MARK = mark
    if (sortType === 'status' && sortVal !== undefined) {
        const sv = Number(sortVal)
        where.JOIN_STATUS = sv === 1099 ? db.cmd().in([10, 99]) : sv
    }
    if (sortType === 'checkin' && sortVal !== undefined) {
        where.JOIN_STATUS = 1
        where.JOIN_IS_CHECKIN = Number(sortVal) === 1 ? 1 : 0
    }
    const result = await db.getList('join', where, {
        fields: 'JOIN_IS_CHECKIN,JOIN_CHECKIN_TIME,JOIN_CODE,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_STATUS,JOIN_ADD_TIME',
        orderBy: { JOIN_ADD_TIME: 'desc' }, page, size
    })
    if (result.list) {
        result.list = result.list.map(item => ({
            ...item,
            JOIN_ADD_TIME: item.JOIN_ADD_TIME ? timestamp2Time(item.JOIN_ADD_TIME) : '',
            JOIN_CHECKIN_TIME: item.JOIN_CHECKIN_TIME ? timestamp2Time(item.JOIN_CHECKIN_TIME) : ''
        }))
    }
    return success(result)
}

async function joinStatus(work, params) {
    const { joinId, status, reason } = params || {}
    const data = { JOIN_STATUS: status }
    if (reason) data.JOIN_REASON = reason
    await db.edit('join', { _id: joinId }, data)
    return success()
}

async function joinDel(work, params) {
    await db.del('join', { _id: (params || {}).joinId })
    return success()
}

async function joinScan(work, params) {
    const { code } = params || {}
    const where = { JOIN_MEET_ID: work._id, JOIN_CODE: code }
    const join = await db.getOne('join', where, 'JOIN_ID,JOIN_IS_CHECKIN')
    if (!join) return fail(CODE.DATA, '预约码无效')
    if (join.JOIN_IS_CHECKIN) return fail(CODE.DATA, '该预约码已经核销过了')
    await db.edit('join', where, { JOIN_IS_CHECKIN: 1, JOIN_CHECKIN_TIME: time() })
    return success(join)
}

async function joinCheckin(work, params) {
    const { joinId, flag } = params || {}
    await db.edit('join', { _id: joinId }, {
        JOIN_IS_CHECKIN: flag ? 1 : 0,
        JOIN_CHECKIN_TIME: flag ? time() : 0
    })
    return success()
}

async function cancelJoinByTime(work, params) {
    const { meetId, timeMark, reason } = params || {}
    await db.edit('join', {
        JOIN_MEET_ID: meetId, JOIN_MEET_TIME_MARK: timeMark, JOIN_STATUS: 1
    }, { JOIN_STATUS: 10, JOIN_REASON: reason || '教练取消' })
    return success()
}

async function tempList(work, params) {
    const meetId = (params && params.meetId) || work._id
    const list = await db.getAll('temp', { TEMP_MEET_ID: meetId }, {
        fields: 'TEMP_NAME,TEMP_TIMES', orderBy: { field: 'TEMP_ADD_TIME', direction: 'desc' }, limit: 100
    })
    return success(list || [])
}

async function tempInsert(work, params) {
    const { name, times, meetId } = params || {}
    await db.insert('temp', { TEMP_NAME: name, TEMP_TIMES: times || [], TEMP_MEET_ID: meetId || work._id })
    return success()
}

async function tempDel(work, params) {
    await db.del('temp', { _id: (params || {}).id })
    return success()
}

async function tempEdit(work, params) {
    const { id, limit, isLimit } = params || {}
    const temp = await db.getOne('temp', { _id: id }, 'TEMP_TIMES')
    if (!temp) return fail(CODE.DATA, '模板不存在')
    const times = (temp.TEMP_TIMES || []).map(t => ({ ...t, isLimit: isLimit || 0, limit: limit || 0 }))
    await db.edit('temp', { _id: id }, { TEMP_TIMES: times })
    return success()
}

function forms2Obj(forms) {
    const obj = {}
    for (const f of (forms || [])) { if (f.mark) obj[f.mark] = f.val }
    return obj
}

async function syncDays(meetId, daysSet) {
    const today = timestamp2Time(time(), 'Y-M-D')
    await db.del('day', { DAY_MEET_ID: meetId, day: db.cmd().lt(today) })
    for (const dayData of (daysSet || [])) {
        if (dayData.day >= today) {
            const exist = await db.getOne('day', { DAY_MEET_ID: meetId, day: dayData.day }, '_id')
            const record = { DAY_MEET_ID: meetId, day: dayData.day, dayDesc: dayData.dayDesc || '', times: dayData.times || [] }
            if (exist) await db.edit('day', { _id: exist._id }, record)
            else await db.insert('day', record)
        }
    }
}

module.exports = {
    login, home, pwd,
    meetDetail, meetEdit, meetUpdateForms,
    dayList,
    joinList, joinStatus, joinDel, joinScan, joinCheckin, cancelJoinByTime,
    tempList, tempInsert, tempDel, tempEdit
}
