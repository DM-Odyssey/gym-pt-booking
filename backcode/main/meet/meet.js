/**
 * 用户端课程预约 — 列表/详情/预约/我的预约
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time } = require('../common/util')


// ===== 课程列表 =====

async function getMeetList(openId, params) {
    const { cateId, search, sortType, sortVal, page = 1, size = 20 } = params
    const where = {}
    if (cateId && cateId !== '0') {
        // 兼容：项目+团课合并为项目课程(cateId=2)，同时查2和3
        if (cateId === '2') where.MEET_CATE_ID = db.cmd().in(['2', '3'])
        else where.MEET_CATE_ID = cateId
    }
    if (search) where.MEET_TITLE = db.regexp(search)
    if (sortType === 'cateId' && sortVal) where.MEET_CATE_ID = String(sortVal)

    where.MEET_STATUS = db.cmd().in([1, 9, 10]) // COMM, OVER, STOP

    const result = await db.getList('meet', where, {
        fields: 'MEET_TITLE,MEET_OBJ,MEET_DAYS,MEET_CATE_NAME,MEET_CATE_ID',
        orderBy: { MEET_ORDER: 'asc' }, page, size
    })
    if (result.list) {
        result.list = result.list.map(item => ({
            ...item,
            type: 'meet',
            id: item._id,
            MEET_OBJ: {
                spec: '', cover: [], desc: '', content: [],
                ...(item.MEET_OBJ || {})
            }
        }))
    }
    return success(result)
}

async function getMeetListByDay(openId, params) {
    const { day } = params
    const list = await db.getAll('meet', { MEET_STATUS: 1 }, {
        fields: 'MEET_TITLE,MEET_OBJ,MEET_DAYS',
        orderBy: { field: 'MEET_ORDER', direction: 'asc' }, limit: 100
    })
    const retList = []
    for (const meet of list) {
        const usefulTimes = await getUsefulTimesByDay(meet._id, day)
        if (usefulTimes.length > 0) {
            retList.push({
                timeDesc: usefulTimes.length > 1 ? usefulTimes.length + '个时段' : usefulTimes[0].start,
                title: meet.MEET_TITLE,
                pic: (meet.MEET_OBJ && meet.MEET_OBJ.cover && meet.MEET_OBJ.cover[0]) || '',
                _id: meet._id
            })
        }
    }
    return success(retList)
}

async function getHasDaysFromDay(openId, params) {
    const { day } = params || {}
    const today = timestamp2Time(time(), 'Y-M-D')
    const startDay = day || today
    const list = await db.getAll('day', { day: db.cmd().gte(startDay) }, {
        fields: 'times,day', orderBy: { field: 'day', direction: 'asc' }, limit: 366
    })
    const retList = []
    for (const d of list) {
        if (d.times && d.times.some(t => t.status === 1)) {
            retList.push(d.day)
        }
    }
    return success(retList)
}

async function getUsefulTimesByDay(meetId, day) {
    const days = await db.getAll('day', { DAY_MEET_ID: meetId, day }, { fields: 'times' })
    const usefulTimes = []
    for (const d of days) {
        for (const t of (d.times || [])) {
            if (t.status === 1) usefulTimes.push(t)
        }
    }
    return usefulTimes
}

// ===== 课程详情 =====

async function viewMeet(openId, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:课程ID' })
    if (vResult.err) return vResult.err

    const meet = await db.getOne('meet', { _id: vResult.data.id })
    if (!meet) return success(null)

    // 获取排期
    const today = timestamp2Time(time(), 'Y-M-D')
    const dayList = await db.getAll('day', {
        DAY_MEET_ID: vResult.data.id, day: db.cmd().gte(today)
    }, { fields: 'day,times,dayDesc', orderBy: { field: 'day', direction: 'asc' }, limit: 365 })

    // 过滤过期和关闭的时段
    const getDaysSet = []
    for (const dayNode of dayList) {
        const getTimes = []
        for (const timeNode of (dayNode.times || [])) {
            if (timeNode.status !== 1) continue
            if (timeNode.isLimit && timeNode.stat && timeNode.stat.succCnt >= timeNode.limit) {
                timeNode.error = '预约已满'
            }
            // 截止检查
            const endTime = dayNode.day + ' ' + (timeNode.end || '23:59') + ':59'
            const now = timestamp2Time(time(), 'Y-M-D h:m:s')
            if (!timeNode.error && now > endTime) {
                timeNode.error = '预约结束'
            }
            getTimes.push(timeNode)
        }
        if (getTimes.length > 0) {
            dayNode.times = getTimes
            getDaysSet.push(dayNode)
        }
    }

    return success({
        MEET_DAYS_SET: getDaysSet,
        MEET_QR: meet.MEET_QR || '',
        MEET_TITLE: meet.MEET_TITLE || '',
        MEET_CATE_ID: meet.MEET_CATE_ID || '',
        MEET_CATE_NAME: meet.MEET_CATE_NAME || '',
        MEET_OBJ: meet.MEET_OBJ || {},
        MEET_COST_MODE: meet.MEET_COST_MODE || 0
    })
}

// ===== 预约流程 =====

async function beforeJoin(openId, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string',
        timeMark: 'timeMark|required|string'
    })
    if (vResult.err) return vResult.err

    const { meetId, timeMark } = vResult.data

    // 检查时段是否存在
    const day = timeMark2Day(timeMark)
    const meet = await db.getOne('meet', { _id: meetId })
    if (!meet) return fail(CODE.LOGIC, '预约项目不存在')

    const daySet = await getDaySetByTimeMark(meetId, timeMark)
    if (!daySet) return fail(CODE.LOGIC, '预约时段选择错误')
    const timeSet = getTimeSet(daySet, timeMark)
    if (!timeSet) return fail(CODE.LOGIC, '预约时段选择错误')

    // 状态检查
    if (timeSet.status === 0) return fail(CODE.LOGIC, '该时段预约已关闭')
    if (timeSet.isLimit && (timeSet.stat && timeSet.stat.succCnt >= timeSet.limit)) {
        return fail(CODE.LOGIC, '该时段预约已满')
    }

    // 截止检查
    const endTime = daySet.day + ' ' + (timeSet.end || '23:59') + ':59'
    const now = timestamp2Time(time(), 'Y-M-D h:m:s')
    if (now > endTime) return fail(CODE.LOGIC, '该时段已结束')

    // 次数检查
    const cnt = await db.count('join', {
        JOIN_MEET_ID: meetId, JOIN_MEET_TIME_MARK: timeMark,
        JOIN_USER_ID: openId, JOIN_STATUS: 1
    })
    if (cnt >= 1) return fail(CODE.LOGIC, '您本时段已经预约')

    // 健身卡检查
    if (meet.MEET_COST_MODE === 1) {
        const cardResult = await findMatchingCard(openId, meet.MEET_CATE_ID)
        if (!cardResult) return fail(CODE.LOGIC, '您没有可用次数，请先办卡')
        return success({ cardId: cardResult._id, cardType: cardResult.CARD_TYPE })
    }

    return success()
}

async function detailForJoin(openId, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string',
        timeMark: 'timeMark|required|string'
    })
    if (vResult.err) return vResult.err

    const { meetId, timeMark } = vResult.data
    const meet = await db.getOne('meet', { _id: meetId }, 'MEET_DAYS_SET,MEET_JOIN_FORMS,MEET_TITLE')
    if (!meet) return success(null)

    const daySet = await getDaySetByTimeMark(meetId, timeMark)
    const timeSet = getTimeSet(daySet, timeMark)
    if (daySet && timeSet) {
        meet.dayDesc = daySet.day + ' ' + (timeSet.start || '') + '～' + (timeSet.end || '')
    }

    // 取最近一次填写的表单
    const joinMy = await db.getOne('join', { JOIN_USER_ID: openId },
        'JOIN_FORMS', { orderBy: { JOIN_ADD_TIME: 'desc' } })
    meet.myForms = (joinMy && joinMy.JOIN_FORMS) ? joinMy.JOIN_FORMS : []

    return success(meet)
}

async function join(openId, params) {
    const vResult = validate(params, {
        meetId: 'meetId|required|string',
        timeMark: 'timeMark|required|string',
        formsList: 'formsList|required|array'
    })
    if (vResult.err) return vResult.err

    const { meetId, timeMark, formsList } = vResult.data

    // 查 meet
    const meet = await db.getOne('meet', { _id: meetId })
    if (!meet) return fail(CODE.LOGIC, '预约项目不存在')

    const daySet = await getDaySetByTimeMark(meetId, timeMark)
    if (!daySet) return fail(CODE.LOGIC, '预约时段选择错误')
    const timeSet = getTimeSet(daySet, timeMark)
    if (!timeSet) return fail(CODE.LOGIC, '预约时段选择错误')

    // 状态检查
    if (timeSet.status === 0) return fail(CODE.LOGIC, '该时段预约已关闭')
    if (timeSet.isLimit && (timeSet.stat && timeSet.stat.succCnt >= timeSet.limit)) {
        return fail(CODE.LOGIC, '该时段预约已满')
    }

    // 截止检查
    const endTime = daySet.day + ' ' + (timeSet.end || '23:59') + ':59'
    const now = timestamp2Time(time(), 'Y-M-D h:m:s')
    if (now > endTime) return fail(CODE.LOGIC, '该时段已结束')

    // 次数检查
    const cnt = await db.count('join', {
        JOIN_MEET_ID: meetId, JOIN_MEET_TIME_MARK: timeMark,
        JOIN_USER_ID: openId, JOIN_STATUS: 1
    })
    if (cnt >= 1) return fail(CODE.LOGIC, '您本时段已经预约')

    // 健身卡扣次
    let usedCardId = ''
    if (meet.MEET_COST_MODE === 1) {
        const card = await findMatchingCard(openId, meet.MEET_CATE_ID)
        if (!card) return fail(CODE.LOGIC, '您没有可用次数，请先办卡')
        const consumed = await consumeCard(card._id)
        if (!consumed) return fail(CODE.LOGIC, '扣次失败，请重试')
        usedCardId = card._id
    }

    // 写入预约
    const day = daySet.day
    const startTime = timeUtil(day + ' ' + (timeSet.start || '00:00') + ':00')
    const code = Math.random().toString(36).substring(2, 17)
    for (const forms of formsList) {
        await db.insert('join', {
            JOIN_USER_ID: openId,
            JOIN_MEET_ID: meetId,
            JOIN_MEET_CATE_ID: meet.MEET_CATE_ID || '',
            JOIN_MEET_CATE_NAME: meet.MEET_CATE_NAME || '',
            JOIN_MEET_TITLE: meet.MEET_TITLE || '',
            JOIN_MEET_DAY: day,
            JOIN_MEET_TIME_START: timeSet.start || '',
            JOIN_MEET_TIME_END: timeSet.end || '',
            JOIN_MEET_TIME_MARK: timeMark,
            JOIN_START_TIME: startTime,
            JOIN_COMPLETE_END_TIME: day + ' ' + (timeSet.end || '23:59'),
            JOIN_FORMS: forms,
            JOIN_OBJ: forms2Obj(forms),
            JOIN_CODE: code,
            JOIN_STATUS: 1,
            JOIN_IS_CHECKIN: 0,
            JOIN_CARD_ID: usedCardId
        })
    }

    // 更新报名统计
    await statJoinCnt(meetId, timeMark)

    return success()
}

// ===== 我的预约 =====

async function getMyJoinList(openId, params) {
    const { sortType, page = 1, size = 20 } = params
    const where = { JOIN_USER_ID: openId }

    if (sortType === 'use') {
        where.JOIN_STATUS = 1
        where.JOIN_COMPLETE_END_TIME = db.cmd().gte(timestamp2Time(time(), 'Y-M-D h:m'))
    } else if (sortType === 'check') {
        where.JOIN_STATUS = 1
        where.JOIN_IS_CHECKIN = 1
    } else if (sortType === 'timeout') {
        where.JOIN_STATUS = 1
        where.JOIN_IS_CHECKIN = 0
        where.JOIN_COMPLETE_END_TIME = db.cmd().lt(timestamp2Time(time(), 'Y-M-D h:m'))
    } else if (sortType === 'cancel') {
        where.JOIN_STATUS = db.cmd().in([10, 99])
    }

    const result = await db.getList('join', where, {
        fields: 'JOIN_COMPLETE_END_TIME,JOIN_IS_CHECKIN,JOIN_REASON,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_STATUS,JOIN_ADD_TIME,JOIN_OBJ',
        orderBy: { JOIN_ADD_TIME: 'desc' }, page, size
    })
    return success(result)
}

async function getMyJoinDetail(openId, params) {
    const vResult = validate(params, { joinId: 'joinId|required|string|desc:预约ID' })
    if (vResult.err) return vResult.err

    const join = await db.getOne('join', {
        _id: vResult.data.joinId, JOIN_USER_ID: openId
    }, 'JOIN_COMPLETE_END_TIME,JOIN_IS_CHECKIN,JOIN_CHECKIN_TIME,JOIN_REASON,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_STATUS,JOIN_ADD_TIME,JOIN_CODE,JOIN_FORMS')
    return success(join || null)
}

async function cancelMyJoin(openId, params) {
    const vResult = validate(params, { joinId: 'joinId|required|string|desc:预约ID' })
    if (vResult.err) return vResult.err

    const where = {
        JOIN_USER_ID: openId,
        _id: vResult.data.joinId,
        JOIN_IS_CHECKIN: 0,
        JOIN_STATUS: 1
    }
    const join = await db.getOne('join', where)
    if (!join) return fail(CODE.LOGIC, '未找到可取消的预约记录')

    // 取消规则检查
    const meet = await db.getOne('meet', { _id: join.JOIN_MEET_ID }, 'MEET_CANCEL_SET')
    if (meet && meet.MEET_CANCEL_SET === 0) return fail(CODE.LOGIC, '该预约不能取消')

    if (meet && meet.MEET_CANCEL_SET === 2) {
        const daySet = await getDaySetByTimeMark(join.JOIN_MEET_ID, join.JOIN_MEET_TIME_MARK)
        const timeSet = getTimeSet(daySet, join.JOIN_MEET_TIME_MARK)
        if (timeSet) {
            const startT = timeUtil(daySet.day + ' ' + (timeSet.start || '00:00') + ':00')
            if (time() > startT) return fail(CODE.LOGIC, '该预约时段已经开始，无法取消')
        }
    }

    await db.del('join', { _id: vResult.data.joinId })
    await statJoinCnt(join.JOIN_MEET_ID, join.JOIN_MEET_TIME_MARK)
    return success()
}

async function getMyJoinSomeday(openId, params) {
    const { day } = params
    const list = await db.getAll('join', {
        JOIN_USER_ID: openId, JOIN_MEET_DAY: day
    }, {
        fields: 'JOIN_IS_CHECKIN,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_STATUS,JOIN_ADD_TIME',
        orderBy: { field: 'JOIN_MEET_TIME_START', direction: 'asc' }, limit: 100
    })
    return success(list || [])
}

// ===== 辅助 =====

function timeMark2Day(timeMark) {
    return timeMark.substr(1, 4) + '-' + timeMark.substr(5, 2) + '-' + timeMark.substr(7, 2)
}

function timeUtil(dateStr) {
    if (!dateStr) return 0
    const d = new Date(dateStr.replace(/-/g, '/'))
    return Math.floor(d.getTime() / 1000)
}

async function getDaySetByTimeMark(meetId, timeMark) {
    const day = timeMark2Day(timeMark)
    const days = await db.getAll('day', { DAY_MEET_ID: meetId, day }, { fields: 'day,times,dayDesc' })
    return days && days.length > 0 ? days[0] : null
}

function getTimeSet(daySet, timeMark) {
    if (!daySet || !daySet.times) return null
    return daySet.times.find(t => t.mark === timeMark) || null
}

async function statJoinCnt(meetId, timeMark) {
    const day = timeMark2Day(timeMark)
    const dayRecord = await db.getOne('day', { DAY_MEET_ID: meetId, day }, 'times')
    if (!dayRecord || !dayRecord.times) return

    const succCnt = await db.count('join', {
        JOIN_MEET_ID: meetId, JOIN_MEET_TIME_MARK: timeMark, JOIN_STATUS: 1
    })
    const cancelCnt = await db.count('join', {
        JOIN_MEET_ID: meetId, JOIN_MEET_TIME_MARK: timeMark, JOIN_STATUS: 10
    })
    const adminCancelCnt = await db.count('join', {
        JOIN_MEET_ID: meetId, JOIN_MEET_TIME_MARK: timeMark, JOIN_STATUS: 99
    })

    for (let j = 0; j < dayRecord.times.length; j++) {
        if (dayRecord.times[j].mark === timeMark) {
            await db.edit('day', { DAY_MEET_ID: meetId, day }, {
                ['times.' + j + '.stat']: { succCnt, cancelCnt, adminCancelCnt }
            })
            break
        }
    }
}

function forms2Obj(forms) {
    const obj = {}
    for (const f of (forms || [])) {
        if (f.mark) obj[f.mark] = f.val
    }
    return obj
}

// ===== 健身卡辅助 =====

/**
 * 查找用户匹配的可用卡
 * 规则：专用卡优先（私教→私教卡，课程→课程卡），其次健身卡
 * 同类型多张：优先消耗即将到期的
 */
async function findMatchingCard(openId, meetCateId) {
    const today = timestamp2Time(time(), 'Y-M-D')
    const cards = await db.getAll('card', {
        CARD_USER_ID: openId,
        CARD_STATUS: 1
    }, { orderBy: { field: 'CARD_EXPIRE', direction: 'asc' }, limit: 20 })

    // 过滤有效且未过期的卡
    const validCards = cards.filter(c => {
        if (c.CARD_EXPIRE && c.CARD_EXPIRE < today) return false
        const remain = (c.CARD_TOTAL || 0) - (c.CARD_USED || 0)
        return remain > 0
    })

    if (validCards.length === 0) return null

    // 按优先级选择：专用卡 > 健身卡
    const cateId = String(meetCateId)
    let dedicated = null  // 专用卡
    let general = null    // 健身卡

    for (const card of validCards) {
        if (card.CARD_TYPE === 1 && cateId === '1') dedicated = card
        else if (card.CARD_TYPE === 2 && cateId !== '1') dedicated = card
        else if (card.CARD_TYPE === 3 && !general) general = card
    }

    return dedicated || general || null
}

/**
 * 原子扣次：使用 inc + 条件 where 防止并发
 */
async function consumeCard(cardId) {
    try {
        const result = await db.coll('card').where({
            _id: cardId,
            CARD_STATUS: 1
        }).update({
            data: { CARD_USED: db.cmd().inc(1) }
        })
        if (!result.stats || result.stats.updated === 0) return false

        // 检查是否用完，更新状态
        const card = await db.getOne('card', { _id: cardId }, 'CARD_TOTAL,CARD_USED')
        if (card && (card.CARD_USED >= card.CARD_TOTAL)) {
            await db.edit('card', { _id: cardId }, { CARD_STATUS: 0 })
        }

        // 写日志
        await db.insert('card_log', {
            LOG_CARD_ID: cardId,
            LOG_USER_ID: card.CARD_USER_ID || '',
            LOG_TYPE: 1,
            LOG_CNT: -1,
            LOG_MEMO: '预约消耗'
        })

        return true
    } catch (e) {
        console.error('consumeCard error:', e)
        return false
    }
}

module.exports = {
    getMeetList, getMeetListByDay, getHasDaysFromDay,
    viewMeet, beforeJoin, detailForJoin, join,
    getMyJoinList, cancelMyJoin, getMyJoinDetail, getMyJoinSomeday
}
