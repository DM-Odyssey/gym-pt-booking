/**
 * 公告模块 — 路由分发（用户端）
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const news = require('./news')

async function handle(route, openId, params, token) {
    switch (route) {
        case 'news/list':
            return await news.getNewsList(params)
        case 'news/view':
            return await news.viewNews(openId, params)
        default:
            return fail(CODE.LOGIC, 'news 路由未实现: ' + route)
    }
}

module.exports = { handle }
