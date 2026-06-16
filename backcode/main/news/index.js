/**
 * 公告模块（用户端）— 路由映射
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const news = require('./news')

const ROUTES = {
    'news/list':  [news.getNewsList],
    'news/view':  [news.viewNews],
}

async function handle(route, openId, params, token) {
    const cfg = ROUTES[route]
    if (!cfg) return fail(CODE.LOGIC, 'news 路由未实现: ' + route)
    return await cfg[0](openId, params)
}

module.exports = { handle }
