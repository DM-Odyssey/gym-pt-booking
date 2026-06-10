/**
 * admin 模块公共辅助
 */
const db = require('../common/db')

function insertLog(admin, content, type = 0) {
    return db.insert('log', {
        LOG_CONTENT: content,
        LOG_ADMIN_ID: admin.ADMIN_ID || admin._id,
        LOG_ADMIN_NAME: admin.ADMIN_NAME || '',
        LOG_ADMIN_DESC: admin.ADMIN_DESC || '',
        LOG_TYPE: type
    }).catch(() => {}) // 日志写入失败不影响主流程
}

module.exports = { insertLog }
