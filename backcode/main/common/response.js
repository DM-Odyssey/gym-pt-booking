/**
 * 统一响应格式 {code, msg, data}
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */

const CODE = {
    SUCC: 200,          // 成功
    SVR: 500,           // 服务器错误
    LOGIC: 1600,        // 业务逻辑错误
    DATA: 1301,         // 参数校验错误
    ADMIN_ERROR: 2401,  // 管理员认证错误
    WORK_ERROR: 2501,   // 教练认证错误
}

function success(data = null, msg = 'ok') {
    return {
        code: CODE.SUCC,
        msg,
        data
    }
}

function fail(code = CODE.LOGIC, msg = '操作失败') {
    return {
        code,
        msg
    }
}

module.exports = { CODE, success, fail }
