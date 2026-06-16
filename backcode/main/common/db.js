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

module.exports = {
    init, coll, cmd,
    getOne, getAll, getList, insert, edit, del, count, inc,
    withPID, regexp, neq, ensureColl
}
