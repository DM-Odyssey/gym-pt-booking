/**
 * 首页模块 — 路由映射
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const home = require('./home')

const ROUTES = {
    'home/list':       [home.getHomeList],
    'home/setup_get':  [home.getSetup],
}

async function handle(route, openId, params, token) {
    const cfg = ROUTES[route]
    if (!cfg) return fail(CODE.LOGIC, 'home 路由未实现: ' + route)
    return await cfg[0](openId, params)
}

module.exports = { handle }
