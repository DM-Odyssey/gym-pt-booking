/**
 * main 云函数主入口 — 模块注册 + 路由分发
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */
const cloud = require('wx-server-sdk')
const db = require('./common/db')
const { fail, CODE } = require('./common/response')

// 模块注册：前缀 → 模块
const MODULES = [
    ['passport/', require('./passport/index.js')],
    ['home/',     require('./home/index.js')],
    ['admin/',    require('./admin/index.js')],
    ['news/',     require('./news/index.js')],
    ['meet/',     require('./meet/index.js')],
    ['work/',     require('./work/index.js')],
]

exports.main = async (event, context) => {
    const { route, params = {}, token, PID } = event
    const env = event.env || cloud.DYNAMIC_CURRENT_ENV

    db.init(env)

    // 自动创建全部集合（轻量，每次运行）
    const allColls = ['admin', 'user', 'news', 'meet', 'join', 'day', 'temp', 'setup', 'log', 'card', 'card_log']
    for (const c of allColls) {
        try { await db.ensureColl(c); } catch (_) {}
    }

    try {
        const openId = cloud.getWXContext().OPENID

        for (const [prefix, mod] of MODULES) {
            if (route.startsWith(prefix)) {
                return await mod.handle(route, openId, params, token)
            }
        }

        return fail(CODE.LOGIC, '路由未实现: ' + route)
    } catch (e) {
        console.error(`[${route}]`, e)
        return fail(CODE.SVR, e.message || '服务器错误')
    }
}
