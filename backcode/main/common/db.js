/**
 * 数据库操作封装 — CRUD + 自动时间戳/IP + 查询辅助
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */

const cloud = require('wx-server-sdk')
const { time, makeID } = require('./util')

let db = null
function init(env) {
    cloud.init({ env })
    db = cloud.database()
}

const cmd = () => db.command
const COLLECTION_PREFIX = 'bx_'

function coll(name) {
    return db.collection(COLLECTION_PREFIX + name)
}

// ===== 基础操作 =====

async function getOne(collection, where, fields = null) {
    const query = coll(collection).where(where)
    const result = fields
        ? await query.field(parseFields(fields)).get()
        : await query.get()
    return result.data && result.data.length > 0 ? result.data[0] : null
}

async function getAll(collection, where, options = {}) {
    const { fields, orderBy, limit = 100 } = options
    let query = coll(collection).where(buildWhere(where))
    if (fields) query = query.field(parseFields(fields))
    if (orderBy) query = query.orderBy(orderBy.field, orderBy.direction || 'desc')
    return (await query.limit(limit).get()).data
}

async function getList(collection, where, options = {}) {
    const { fields, orderBy, page = 1, size = 20, showTotal = true } = options
    let query = coll(collection).where(buildWhere(where))
    if (fields) query = query.field(parseFields(fields))
    if (orderBy) {
        for (const [field, dir] of Object.entries(orderBy)) {
            query = query.orderBy(field, dir)
        }
    }
    let total = 0
    if (showTotal) {
        try { total = (await query.count()).total } catch (_) {}
    }
    const skip = (page - 1) * size
    const dataResult = await query.skip(skip).limit(size).get()
    return { list: dataResult.data, total, page, size, count: Math.ceil(total / size) }
}

async function insert(collection, data) {
    // 自动时间戳
    const now = time()
    data.ADD_TIME = data.ADD_TIME || now
    data.EDIT_TIME = data.EDIT_TIME || now
    // 自动 IP（云函数环境有效）
    try { data.ADD_IP = data.ADD_IP || cloud.getWXContext().CLIENTIP } catch (_) {}
    try { data.EDIT_IP = data.EDIT_IP || cloud.getWXContext().CLIENTIP } catch (_) {}
    const result = await coll(collection).add({ data })
    return result._id
}

async function edit(collection, where, data) {
    data.EDIT_TIME = data.EDIT_TIME || time()
    try { data.EDIT_IP = data.EDIT_IP || cloud.getWXContext().CLIENTIP } catch (_) {}
    const result = await coll(collection).where(where).update({ data })
    return result.stats.updated
}

async function del(collection, where) {
    // 空 where 会触发 -501007 错误，用 _id.exists(true) 兜底匹配所有文档
    if (!where || Object.keys(where).length === 0) {
        where = { _id: cmd().exists(true) }
    }
    return (await coll(collection).where(where).remove()).stats.removed
}

async function count(collection, where) {
    return (await coll(collection).where(where).count()).total
}

async function inc(collection, where, field, val = 1) {
    return await coll(collection).where(where).update({
        data: { [field]: cmd().inc(val) }
    })
}

// ===== 辅助 =====

// 处理 where 中的 or/and 键，转为 db.command 调用
function buildWhere(raw) {
    if (!raw) return {}
    const clean = {}
    for (const [k, v] of Object.entries(raw)) {
        if (k === 'or' && Array.isArray(v)) {
            return db.command.or(v.map(buildWhere))
        }
        if (k === 'and' && Array.isArray(v)) {
            return db.command.and(v.map(buildWhere))
        }
        clean[k] = v
    }
    return clean
}

function regexp(pattern) {
    if (!db) return null
    return db.RegExp({ regexp: pattern, options: 'i' })
}

function neq(val) {
    return db ? db.command.neq(val) : null
}

function parseFields(fields) {
    if (!fields || fields === '*') return {}
    if (typeof fields === 'object') return fields
    const obj = {}
    fields.split(',').forEach(f => { obj[f.trim()] = true })
    return obj
}

function withPID(where = {}, pid = 'workfit') {
    where._pid = pid
    return where
}

// 确保集合存在（不存在则自动创建）
async function ensureColl(name) {
    const fullName = COLLECTION_PREFIX + name
    try {
        await db.createCollection(fullName)
        console.log('[db] 集合已创建: ' + fullName)
    } catch (e) {
        // 集合已存在则忽略（本地调试 -501001，云端 -502005）
        const code = e.errCode || 0
        const msg = String(e.message || e)
        if (code === -501001 || code === -502005 || msg.includes('ALREADY_EXIST') || msg.includes('ResourceExist')) {
            return
        }
        console.warn('[db] 创建集合失败: ' + fullName, e.message || e)
    }
}

// 自动创建默认管理员（admin / 123456）
async function ensureAdmin() {
    const { total: cnt } = await coll('admin').count()
    if (cnt > 0) return
    const bcrypt = require('bcryptjs')
    const pwd = await bcrypt.hash('123456', 10)
    await coll('admin').add({ data: {
        ADMIN_NAME: 'admin',
        ADMIN_PASSWORD: pwd,
        ADMIN_TYPE: 1,
        ADMIN_STATUS: 1,
        ADMIN_DESC: '默认超级管理员'
    }})
    console.log('[db] 默认管理员已创建: admin / 123456')
}

// 首次部署种子数据
async function seedData() {
    const bcrypt = require('bcryptjs')

    // 公告
    try {
        const { total: cnt } = await coll('news').count()
        if (cnt === 0) {
            await coll('news').add({ data: {
                NEWS_TITLE: '欢迎使用健身房私教预约系统',
                NEWS_DESC: '本系统支持用户在线预约教练课程，教练可管理排期与核销，管理后台提供完整的预约数据管理能力。',
                NEWS_CATE_ID: '0',
                NEWS_CATE_NAME: '平台公告',
                NEWS_STATUS: 1,
                NEWS_VOUCH: 1,
                NEWS_ORDER: 0,
                NEWS_CONTENT: [{ type: 'text', val: '欢迎使用健身房私教预约小程序！系统支持用户端、教练端、管理后台三端一体化管理。' }]
            }})
            console.log('[db] 种子公告已创建')
        }
    } catch (e) { console.warn('[db] 种子公告失败:', e.message) }

    // 教练 — 不设密码，仅示例展示
    try {
        const { total: cnt } = await coll('meet').count()
        if (cnt === 0) {
            const pwd = await bcrypt.hash('123456', 10)
            await coll('meet').add({ data: {
                MEET_TITLE: '示例教练 - 李教练',
                MEET_CATE_ID: '1',
                MEET_CATE_NAME: '私教',
                MEET_STATUS: 1,
                MEET_PASSWORD: pwd,
                MEET_ORDER: 1,
                MEET_VOUCH: 1,
                MEET_COST_MODE: 1,
                MEET_CANCEL_SET: 1,
                MEET_OBJ: { desc: '资深健身教练，拥有多年私教经验，擅长增肌减脂、体能训练。欢迎预约体验！' },
                MEET_DAYS: [],
                MEET_JOIN_FORMS: [
                    { mark: 'name', type: 'text', title: '姓名', must: true, min: 2, max: 30 },
                    { mark: 'phone', type: 'text', title: '手机号', len: 11, must: true }
                ],
                MEET_FORMS: []
            }})
            console.log('[db] 种子教练已创建')
        }
    } catch (e) { console.warn('[db] 种子教练失败:', e.message) }

    // 课程 — 在教练已插入后再判断
    try {
        const { total: cnt } = await coll('meet').where({ MEET_CATE_ID: cmd().neq('1') }).count()
        if (cnt === 0) {
            await coll('meet').add({ data: {
                MEET_TITLE: '示例课程 - 动感单车',
                MEET_CATE_ID: '2',
                MEET_CATE_NAME: '团课',
                MEET_STATUS: 1,
                MEET_ORDER: 2,
                MEET_VOUCH: 1,
                MEET_COST_MODE: 0,
                MEET_CANCEL_SET: 1,
                MEET_OBJ: { desc: '燃脂动感单车课程，跟随节奏燃烧卡路里，适合各水平健身爱好者。' },
                MEET_DAYS: [],
                MEET_JOIN_FORMS: [
                    { mark: 'name', type: 'text', title: '姓名', must: true, min: 2, max: 30 },
                    { mark: 'phone', type: 'text', title: '手机号', len: 11, must: true }
                ],
                MEET_FORMS: []
            }})
            console.log('[db] 种子课程已创建')
        }
    } catch (e) { console.warn('[db] 种子课程失败:', e.message) }
}

module.exports = {
    init, coll, cmd,
    getOne, getAll, getList, insert, edit, del, count, inc,
    withPID, regexp, neq, ensureColl, ensureAdmin, seedData
}
