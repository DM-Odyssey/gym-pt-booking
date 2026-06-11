/**
 * 首页 — 推荐列表 + 系统设置查询
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, CODE } = require('../common/response')

const SETUP_HOME_VOUCH_KEY = 'SETUP_HOME_VOUCH_KEY'

async function getHomeList(openId, params) {
    const setupRes = await db.coll('setup').where({ SETUP_KEY: SETUP_HOME_VOUCH_KEY }).get()
    let list = null
    if (setupRes.data && setupRes.data.length > 0) {
        const val = (setupRes.data[0].SETUP_VALUE && setupRes.data[0].SETUP_VALUE.val) || null
        if (val && Array.isArray(val) && val.length > 0) list = val
    }

    if (!list || list.length === 0) {
        const retList = await db.getAll('news', { NEWS_STATUS: 1 }, {
            fields: 'NEWS_PIC,NEWS_CATE_NAME,NEWS_TITLE,NEWS_DESC,NEWS_ADD_TIME',
            orderBy: { field: 'NEWS_ORDER', direction: 'asc' }, limit: 10
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

async function getSetup(openId, params) {
    const vResult = validate(params, { key: 'key|required|string|desc:KEY' })
    if (vResult.err) return vResult.err

    const result = await db.coll('setup').where({ SETUP_KEY: vResult.data.key }).get()
    if (!result.data || result.data.length === 0) return success(null)

    const setupValue = result.data[0].SETUP_VALUE
    return success(setupValue ? setupValue.val : null)
}

module.exports = { getHomeList, getSetup }
