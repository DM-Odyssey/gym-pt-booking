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
    let list = []

    // 1. 查手动配置的首页推荐
    const setupRes = await db.coll('setup').where({ SETUP_KEY: SETUP_HOME_VOUCH_KEY }).get()
    if (setupRes.data && setupRes.data.length > 0) {
        const val = (setupRes.data[0].SETUP_VALUE && setupRes.data[0].SETUP_VALUE.val) || null
        if (val && Array.isArray(val) && val.length > 0) list = val
    }

    // 2. 查标记为推荐的课程 (MEET_VOUCH=1)
    if (list.length === 0) {
        const meetList = await db.getAll('meet', { MEET_VOUCH: 1, MEET_STATUS: 1 }, {
            fields: 'MEET_TITLE,MEET_OBJ,MEET_CATE_NAME,MEET_CATE_ID',
            orderBy: { field: 'MEET_ORDER', direction: 'asc' }, limit: 10
        })
        if (meetList && meetList.length > 0) {
            list = meetList.map(item => ({
                type: 'meet',
                ext: item.MEET_CATE_NAME || '',
                title: item.MEET_TITLE || '',
                id: item._id,
                desc: (item.MEET_OBJ && item.MEET_OBJ.desc) ? item.MEET_OBJ.desc : '',
                pic: (item.MEET_OBJ && item.MEET_OBJ.cover && item.MEET_OBJ.cover[0]) ? item.MEET_OBJ.cover[0] : ''
            }))
        }
    }

    // 3. 都没有则降级显示公告
    if (list.length === 0) {
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
