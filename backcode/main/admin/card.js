/**
 * 健身卡管理 — 发卡/编辑/删除/日志
 * Author: DM-Odyssey
 * Date: 2026-06-13
 */
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time } = require('../common/util')
const { insertLog } = require('./_helper')

const CARD_TYPE_MAP = { 1: '私教卡', 2: '课程卡', 3: '健身卡' }
const CARD_STATUS_MAP = { 1: '有效', 0: '已用完', 9: '已过期', 99: '已作废' }

// ===== 卡列表 =====

async function getCardList(admin, params) {
    const { search, cardType, cardStatus, page = 1, size = 20 } = params
    const where = {}

    if (search) {
        where.or = [
            { CARD_USER_NAME: db.regexp(search) },
            { CARD_USER_MOBILE: db.regexp(search) },
            { CARD_MEMO: db.regexp(search) }
        ]
    }
    if (cardType && cardType !== '0') where.CARD_TYPE = Number(cardType)
    if (cardStatus !== undefined && cardStatus !== '' && cardStatus !== '0') {
        where.CARD_STATUS = Number(cardStatus)
    }

    const result = await db.getList('card', where, {
        orderBy: { CARD_ADD_TIME: 'desc' }, page, size
    })

    if (result.list) {
        result.list = result.list.map(c => ({
            ...c,
            CARD_TYPE_NAME: CARD_TYPE_MAP[c.CARD_TYPE] || '',
            CARD_STATUS_NAME: CARD_STATUS_MAP[c.CARD_STATUS] || '',
            CARD_ADD_TIME: c.CARD_ADD_TIME ? timestamp2Time(c.CARD_ADD_TIME) : '',
            CARD_EXPIRE: c.CARD_EXPIRE || ''
        }))
    }
    return success(result)
}

// ===== 发卡 =====

async function addCard(admin, params) {
    const vResult = validate(params, {
        userId: 'userId|required|string|desc:用户OpenID',
        cardType: 'cardType|required|int|desc:卡类型',
        total: 'total|required|int|min:1|max:999|desc:总次数',
        expire: 'expire|string|default:""',
        memo: 'memo|string|default:""'
    })
    if (vResult.err) return vResult.err

    const { userId, cardType, total, expire, memo } = vResult.data

    // 校验卡类型
    if (![1, 2, 3].includes(cardType)) return fail(CODE.LOGIC, '卡类型无效')

    // 查用户
    const user = await db.getOne('user', { USER_MINI_OPENID: userId },
        'USER_NAME,USER_MOBILE')
    if (!user) return fail(CODE.DATA, '用户不存在')

    // 检查同类型是否已有有效卡
    const existCard = await db.getOne('card', {
        CARD_USER_ID: userId,
        CARD_TYPE: cardType,
        CARD_STATUS: 1
    })

    let cardId
    if (existCard) {
        // 追加到已有卡
        await db.edit('card', { _id: existCard._id }, {
            CARD_TOTAL: (existCard.CARD_TOTAL || 0) + total,
            CARD_EXPIRE: expire || existCard.CARD_EXPIRE || '',
            CARD_MEMO: memo || existCard.CARD_MEMO || '',
            CARD_STATUS: 1
        })
        cardId = existCard._id
    } else {
        // 新建卡
        cardId = await db.insert('card', {
            CARD_USER_ID: userId,
            CARD_USER_NAME: user.USER_NAME || '',
            CARD_USER_MOBILE: user.USER_MOBILE || '',
            CARD_TYPE: cardType,
            CARD_TOTAL: total,
            CARD_USED: 0,
            CARD_EXPIRE: expire,
            CARD_STATUS: 1,
            CARD_MEMO: memo,
            CARD_ADMIN_ID: admin.ADMIN_ID || admin._id || ''
        })
    }

    // 写入日志
    await db.insert('card_log', {
        LOG_CARD_ID: cardId,
        LOG_USER_ID: userId,
        LOG_TYPE: 3,
        LOG_CNT: total,
        LOG_MEMO: memo || '管理员发卡',
        LOG_ADMIN_ID: admin.ADMIN_ID || admin._id || ''
    })

    const typeName = CARD_TYPE_MAP[cardType]
    insertLog(admin,
        (existCard ? '追加' : '新发') + '了【' + user.USER_NAME + '】的' +
        typeName + total + '次', 1)

    return success({ cardId })
}

// ===== 编辑卡 =====

async function editCard(admin, params) {
    const vResult = validate(params, {
        cardId: 'cardId|required|string|desc:卡ID',
        addTotal: 'addTotal|int|default:0',
        expire: 'expire|string|default:""',
        status: 'status|int|default:0',
        memo: 'memo|string|default:""'
    })
    if (vResult.err) return vResult.err

    const { cardId, addTotal, expire, status, memo } = vResult.data

    const card = await db.getOne('card', { _id: cardId })
    if (!card) return fail(CODE.DATA, '健身卡不存在')

    const updateData = {}
    const logItems = []

    // 追加次数
    if (addTotal !== 0) {
        const newTotal = Math.max(0, (card.CARD_TOTAL || 0) + addTotal)
        updateData.CARD_TOTAL = newTotal
        // 如果追加后 total > used，恢复为有效
        if (newTotal > (card.CARD_USED || 0) && card.CARD_STATUS === 0) {
            updateData.CARD_STATUS = 1
        }
        if (newTotal <= (card.CARD_USED || 0)) {
            updateData.CARD_STATUS = 0
        }

        logItems.push({
            LOG_CARD_ID: cardId,
            LOG_USER_ID: card.CARD_USER_ID,
            LOG_TYPE: 3,
            LOG_CNT: addTotal,
            LOG_MEMO: '管理员调整次数: ' + (addTotal > 0 ? '+' + addTotal : String(addTotal)) +
                (memo ? ' (' + memo + ')' : ''),
            LOG_ADMIN_ID: admin.ADMIN_ID || admin._id || ''
        })
    }

    // 修改有效期
    if (expire !== undefined && expire !== '') {
        updateData.CARD_EXPIRE = expire
    }

    // 修改状态
    if (status && status !== card.CARD_STATUS) {
        updateData.CARD_STATUS = status
        logItems.push({
            LOG_CARD_ID: cardId,
            LOG_USER_ID: card.CARD_USER_ID,
            LOG_TYPE: 3,
            LOG_CNT: 0,
            LOG_MEMO: '管理员修改状态: ' + (CARD_STATUS_MAP[status] || status) +
                (memo ? ' (' + memo + ')' : ''),
            LOG_ADMIN_ID: admin.ADMIN_ID || admin._id || ''
        })
    }

    // 修改备注
    if (memo) {
        updateData.CARD_MEMO = memo
    }

    if (Object.keys(updateData).length > 0) {
        await db.edit('card', { _id: cardId }, updateData)
    }

    // 写入日志
    for (const logItem of logItems) {
        await db.insert('card_log', logItem)
    }

    const typeName = CARD_TYPE_MAP[card.CARD_TYPE] || ''
    insertLog(admin, '编辑了【' + (card.CARD_USER_NAME || card.CARD_USER_ID) + '】的' +
        typeName, 1)

    return success()
}

// ===== 删除卡 =====

async function delCard(admin, params) {
    const vResult = validate(params, {
        cardId: 'cardId|required|string|desc:卡ID'
    })
    if (vResult.err) return vResult.err

    const card = await db.getOne('card', { _id: vResult.data.cardId })
    if (!card) return fail(CODE.DATA, '健身卡不存在')

    if ((card.CARD_USED || 0) > 0) {
        return fail(CODE.LOGIC, '该卡已有消费记录，不可删除，可设为作废')
    }

    await db.del('card', { _id: vResult.data.cardId })
    // 同时删除日志
    await db.del('card_log', { LOG_CARD_ID: vResult.data.cardId })

    const typeName = CARD_TYPE_MAP[card.CARD_TYPE] || ''
    insertLog(admin, '删除了【' + (card.CARD_USER_NAME || card.CARD_USER_ID) + '】的' +
        typeName, 1)

    return success()
}

// ===== 用户卡列表（管理员查看某用户的卡） =====

async function getUserCards(admin, params) {
    const vResult = validate(params, {
        userId: 'userId|required|string|desc:用户OpenID'
    })
    if (vResult.err) return vResult.err

    const cards = await db.getAll('card', { CARD_USER_ID: vResult.data.userId }, {
        orderBy: { field: 'CARD_ADD_TIME', direction: 'desc' }, limit: 50
    })

    // 实时检查过期
    const today = timestamp2Time(time(), 'Y-M-D')
    for (const card of cards) {
        card.CARD_TYPE_NAME = CARD_TYPE_MAP[card.CARD_TYPE] || ''
        card.CARD_STATUS_NAME = CARD_STATUS_MAP[card.CARD_STATUS] || ''
        card.CARD_ADD_TIME_STR = card.CARD_ADD_TIME ? timestamp2Time(card.CARD_ADD_TIME) : ''
        // 标记过期
        if (card.CARD_STATUS === 1 && card.CARD_EXPIRE && card.CARD_EXPIRE < today) {
            card._expired = true
        }
    }

    return success(cards)
}

// ===== 卡消费日志 =====

async function getCardLog(admin, params) {
    const { cardId, userId, page = 1, size = 20 } = params
    const where = {}
    if (cardId) where.LOG_CARD_ID = cardId
    if (userId) where.LOG_USER_ID = userId

    const result = await db.getList('card_log', where, {
        orderBy: { LOG_ADD_TIME: 'desc' }, page, size
    })

    if (result.list) {
        result.list = result.list.map(l => ({
            ...l,
            LOG_TYPE_NAME: { 1: '预约消耗', 2: '取消退还', 3: '管理员调整' }[l.LOG_TYPE] || '',
            LOG_ADD_TIME: l.LOG_ADD_TIME ? timestamp2Time(l.LOG_ADD_TIME) : ''
        }))
    }
    return success(result)
}

module.exports = { getCardList, addCard, editCard, delCard, getUserCards, getCardLog }
