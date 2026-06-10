/**
 * home 模块 — 首页 & 系统设置
 * 路由: home/list, home/setup_get
 */
const cloud = require('wx-server-sdk')
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')

const SETUP_HOME_VOUCH_KEY = 'SETUP_HOME_VOUCH_KEY'

async function handle(route, openId, params, token) {
    switch (route) {
        case 'home/list':
            return await getHomeList(params)
        case 'home/setup_get':
            return await getSetup(params)
        default:
            return fail(CODE.LOGIC, 'home 路由未实现: ' + route)
    }
}

/**
 * 首页推荐列表
 * 优先读 SETUP_HOME_VOUCH_KEY 推荐配置，否则回退到最新 10 条公告
 */
async function getHomeList(params) {
    // 1. 尝试读取首页推荐设置
    const setupRes = await db.coll('setup').where({ SETUP_KEY: SETUP_HOME_VOUCH_KEY }).get()
    let list = null
    if (setupRes.data && setupRes.data.length > 0) {
        const setupRecord = setupRes.data[0]
        const val = (setupRecord.SETUP_VALUE && setupRecord.SETUP_VALUE.val) || null
        if (val && Array.isArray(val) && val.length > 0) {
            list = val
        }
    }

    // 2. 回退：最新 10 条已发布公告
    if (!list || list.length === 0) {
        const newsWhere = { NEWS_STATUS: 1 }
        const retList = await db.getAll('news', newsWhere, {
            fields: 'NEWS_PIC,NEWS_CATE_NAME,NEWS_TITLE,NEWS_DESC,NEWS_ADD_TIME',
            orderBy: { field: 'NEWS_ORDER', direction: 'asc' },
            limit: 10
        })

        list = (retList || []).map(item => ({
            type: 'news',
            ext: item.NEWS_CATE_NAME || '',
            title: item.NEWS_TITLE || '',
            id: item._id,
            desc: item.NEWS_DESC || '',
            pic: item.NEWS_PIC || ''
        }))
    }

    return success(list)
}

/**
 * 获取系统设置值
 * @param {Object} params - { key: string }
 */
async function getSetup(params) {
    const vResult = validate(params, {
        key: 'key|required|string|desc:KEY'
    })
    if (vResult.err) return vResult.err

    const result = await db.coll('setup').where({ SETUP_KEY: vResult.data.key }).get()
    if (!result.data || result.data.length === 0) {
        return success(null)
    }

    const setupValue = result.data[0].SETUP_VALUE
    return success(setupValue ? setupValue.val : null)
}

module.exports = { handle }
