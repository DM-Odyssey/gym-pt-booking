/**
 * admin 模块 — 路由分发（映射表 + 鉴权）
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const { checkAdmin } = require('../common/auth')
const { fail, CODE } = require('../common/response')
const mgr = require('./mgr')
const log = require('./log')
const setup = require('./setup')
const user = require('./user')
const news = require('./news')
const meet = require('./meet')

const ROUTES = {
    // 登录
    'admin/login':          [mgr.adminLogin, false],

    // 仪表盘
    'admin/home':           [mgr.adminHome],
    'admin/clear_vouch':    [mgr.clearVouch],

    // 管理员管理
    'admin/mgr_list':       [mgr.getMgrList],
    'admin/mgr_insert':     [mgr.insertMgr],
    'admin/mgr_del':        [mgr.delMgr],
    'admin/mgr_detail':     [mgr.getMgrDetail],
    'admin/mgr_edit':       [mgr.editMgr],
    'admin/mgr_status':     [mgr.statusMgr],
    'admin/mgr_pwd':        [mgr.pwdMgr],

    // 操作日志
    'admin/log_list':       [log.getLogList],
    'admin/log_clear':      [log.clearLog],

    // 系统设置
    'admin/setup_set':          [setup.setSetup],
    'admin/setup_set_content':  [setup.setContentSetup],
    'admin/setup_qr':           [setup.genMiniQr],

    // 用户管理
    'admin/user_list':      [user.getUserList],
    'admin/user_detail':    [user.getUserDetail],
    'admin/user_del':       [user.delUser],
    'admin/user_status':        [user.statusUser],
    'admin/user_data_get':      [user.getUserDataURL],
    'admin/user_data_export':   [user.exportUserData],
    'admin/user_data_del':      [user.deleteUserData],

    // 资讯管理
    'admin/news_list':              [news.getAdminNewsList],
    'admin/news_insert':            [news.insertNews],
    'admin/news_detail':            [news.getNewsDetail],
    'admin/news_edit':              [news.editNews],
    'admin/news_update_forms':      [news.updateNewsForms],
    'admin/news_update_pic':        [news.updateNewsPic],
    'admin/news_update_content':    [news.updateNewsContent],
    'admin/news_del':               [news.delNews],
    'admin/news_sort':              [news.sortNews],
    'admin/news_status':            [news.statusNews],
    'admin/news_vouch':             [news.vouchNews],

    // 课程管理
    'admin/meet_list':              [meet.getAdminMeetList],
    'admin/meet_insert':            [meet.insertMeet],
    'admin/meet_detail':            [meet.getMeetDetail],
    'admin/meet_edit':              [meet.editMeet],
    'admin/meet_del':               [meet.delMeet],
    'admin/meet_sort':              [meet.sortMeet],
    'admin/meet_vouch':             [meet.vouchMeet],
    'admin/meet_status':            [meet.statusMeet],
    'admin/meet_update_forms':      [meet.updateMeetForms],
    'admin/meet_day_list':          [meet.getDayList],
    'admin/meet_set_days':          [meet.setDays],
    'admin/meet_join_list':         [meet.getJoinList],
    'admin/join_status':            [meet.statusJoin],
    'admin/join_del':               [meet.delJoin],
    'admin/join_scan':              [meet.scanJoin],
    'admin/join_checkin':           [meet.checkinJoin],
    'admin/meet_cancel_time_join':  [meet.cancelJoinByTimeMark],
    'admin/self_checkin_qr':        [meet.genSelfCheckinQr],
    'admin/meet_temp_list':         [meet.getMeetTempList],
    'admin/meet_temp_insert':       [meet.insertMeetTemp],
    'admin/meet_temp_del':          [meet.delMeetTemp],
    'admin/meet_temp_edit':         [meet.editMeetTemp],
    'admin/join_data_get':          [meet.getJoinDataURL],
    'admin/join_data_export':       [meet.exportJoinData],
    'admin/join_data_del':          [meet.deleteJoinData],
}

async function handle(route, openId, params, token) {
    const cfg = ROUTES[route]
    if (!cfg) return fail(CODE.LOGIC, 'admin 路由未实现: ' + route)

    const [handler, needAuth = true] = cfg
    if (!needAuth) return await handler(params)

    const result = await checkAdmin(token)
    if (result.err) return result.err
    return await handler(result.admin, params)
}

module.exports = { handle }
