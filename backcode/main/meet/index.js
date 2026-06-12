/**
 * 课程预约模块（用户端）— 路由映射
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { fail, CODE } = require('../common/response')
const meet = require('./meet')

const ROUTES = {
    'meet/list':             [meet.getMeetList],
    'meet/list_by_day':      [meet.getMeetListByDay],
    'meet/list_has_day':     [meet.getHasDaysFromDay],
    'meet/view':             [meet.viewMeet],
    'meet/before_join':      [meet.beforeJoin],
    'meet/detail_for_join':  [meet.detailForJoin],
    'meet/join':             [meet.join],
    'meet/my_join_list':     [meet.getMyJoinList],
    'meet/my_join_cancel':   [meet.cancelMyJoin],
    'meet/my_join_detail':   [meet.getMyJoinDetail],
    'meet/my_join_someday':  [meet.getMyJoinSomeday],
}

async function handle(route, openId, params, token) {
    const cfg = ROUTES[route]
    if (!cfg) return fail(CODE.LOGIC, 'meet 路由未实现: ' + route)
    return await cfg[0](openId, params)
}

module.exports = { handle }
