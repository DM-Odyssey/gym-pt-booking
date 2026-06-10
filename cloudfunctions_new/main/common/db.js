/**
 * 数据库操作封装
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
    let query = coll(collection).where(where)
    if (fields) query = query.field(parseFields(fields))
    if (orderBy) query = query.orderBy(orderBy.field, orderBy.direction || 'desc')
    return (await query.limit(limit).get()).data
}

async function getList(collection, where, options = {}) {
    const { fields, orderBy, page = 1, size = 20 } = options
    let query = coll(collection).where(where)
    if (fields) query = query.field(parseFields(fields))
    if (orderBy) {
        for (const [field, dir] of Object.entries(orderBy)) {
            query = query.orderBy(field, dir)
        }
    }
    const countResult = await query.count()
    const total = countResult.total
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

module.exports = {
    init, coll,
    getOne, getAll, getList, insert, edit, del, count, inc,
    withPID
}
