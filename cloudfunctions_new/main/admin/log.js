/**
 * 操作日志查询与清除
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const db = require('../common/db')
const { success } = require('../common/response')
const { insertLog } = require('./_helper')

async function getLogList(admin, params) {
    const { search, sortType, sortVal, page = 1, size = 20 } = params
    const where = {}

    if (search) {
        where.or = [
            { LOG_CONTENT: db.regexp(search) },
            { LOG_ADMIN_DESC: db.regexp(search) },
            { LOG_ADMIN_NAME: db.regexp(search) }
        ]
    }
    if (sortType === 'type' && sortVal !== undefined) where.LOG_TYPE = Number(sortVal)

    const result = await db.getList('log', where, {
        orderBy: { LOG_ADD_TIME: 'desc' },
        page, size
    })
    return success(result)
}

async function clearLog(admin, params) {
    await db.del('log', {})
    insertLog(admin, '清除了操作日志', 0)
    return success()
}

module.exports = { getLogList, clearLog }
