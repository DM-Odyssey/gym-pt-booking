/**
 * 教练端模块 — 路由映射
 * Author: DM-Odyssey
 * Date: 2026-06-10
 */
const { checkWork } = require('../common/auth')
const { fail, CODE } = require('../common/response')
const work = require('./work')

const ROUTES = {
    'work/login':                   [work.login, false],

    'work/home':                    [work.home],
    'work/pwd':                     [work.pwd],

    'work/meet_detail':             [work.meetDetail],
    'work/meet_edit':               [work.meetEdit],
    'work/meet_update_forms':       [work.meetUpdateForms],

    'work/meet_day_list':           [work.dayList],

    'work/meet_join_list':          [work.joinList],
    'work/join_status':             [work.joinStatus],
    'work/join_del':                [work.joinDel],
    'work/join_scan':               [work.joinScan],
    'work/join_checkin':            [work.joinCheckin],
    'work/meet_cancel_time_join':   [work.cancelJoinByTime],

    'work/meet_temp_list':          [work.tempList],
    'work/meet_temp_insert':        [work.tempInsert],
    'work/meet_temp_del':           [work.tempDel],
    'work/meet_temp_edit':          [work.tempEdit],
}

async function handle(route, openId, params, token) {
    const cfg = ROUTES[route]
    if (!cfg) return fail(CODE.LOGIC, 'work 路由未实现: ' + route)

    const [handler, needAuth = true] = cfg
    if (!needAuth) return await handler(params)

    const result = await checkWork(token)
    if (result.err) return result.err
    return await handler(result.work, params)
}

module.exports = { handle }
