/**
 * 通行证模块 — 路由分发
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const passport = require('./passport')

async function handle(route, openId, params, token) {
    switch (route) {
        case 'passport/login':
            return await passport.login(openId)
        case 'passport/register':
            return await passport.register(openId, params)
        case 'passport/phone':
            return await passport.getPhone(openId, params)
        case 'passport/my_detail':
            return await passport.getMyDetail(openId)
        case 'passport/edit_base':
            return await passport.editBase(openId, params)
        default:
            return fail(CODE.LOGIC, '未知路由: ' + route)
    }
}

module.exports = { handle }
