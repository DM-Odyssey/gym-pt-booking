/**
 * 首页模块 — 路由分发
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const home = require('./home')

async function handle(route, openId, params, token) {
    switch (route) {
        case 'home/list':
            return await home.getHomeList()
        case 'home/setup_get':
            return await home.getSetup(openId, params)
        default:
            return fail(CODE.LOGIC, 'home 路由未实现: ' + route)
    }
}

module.exports = { handle }
