/**
 * main 云函数 — 主入口
 * 替代 CCMiniCloud 框架，使用 wx-server-sdk 原生 API
 */
const cloud = require('wx-server-sdk')
const db = require('./common/db')
const { success, fail, CODE } = require('./common/response')
const passport = require('./passport/index.js')

exports.main = async (event, context) => {
    const { route, params = {}, token, PID } = event
    const env = event.env || cloud.DYNAMIC_CURRENT_ENV

    // 初始化
    db.init(env)

    try {
        let result

        // 路由分发
        if (route.startsWith('passport/')) {
            result = await passport.handle(route, cloud.getWXContext().OPENID, params)
        }
        // TODO: 后续模块
        // else if (route.startsWith('home/')) { result = await home.handle(route, params) }
        // else if (route.startsWith('admin/')) { result = await admin.handle(route, params, token) }
        // ...
        else {
            return fail(CODE.LOGIC, '路由未实现: ' + route)
        }

        return result
    } catch (e) {
        console.error(`[${route}]`, e)
        return fail(CODE.SVR, e.message || '服务器错误')
    }
}
