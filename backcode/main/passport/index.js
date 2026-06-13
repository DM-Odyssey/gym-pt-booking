/**
 * 通行证模块 — 路由映射
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const passport = require('./passport')

const ROUTES = {
    'passport/login':      [passport.login],
    'passport/register':   [passport.register],
    'passport/phone':      [passport.getPhone],
    'passport/my_detail':  [passport.getMyDetail],
    'passport/edit_base':  [passport.editBase],
    'passport/my_card':    [passport.getMyCard],
}

async function handle(route, openId, params, token) {
    const cfg = ROUTES[route]
    if (!cfg) return fail(CODE.LOGIC, 'passport 路由未实现: ' + route)
    return await cfg[0](openId, params)
}

module.exports = { handle }
