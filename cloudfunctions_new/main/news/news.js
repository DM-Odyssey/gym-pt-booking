/**
 * 用户端公告 — 列表 + 详情
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success } = require('../common/response')

async function getNewsList(params) {
    const { cateId, search, sortType, sortVal, page = 1, size = 20 } = params
    const where = { NEWS_STATUS: 1 }

    if (cateId && cateId !== '0') where.NEWS_CATE_ID = cateId
    if (search) where.NEWS_TITLE = db.regexp(search)
    if (sortType === 'cateId' && sortVal) where.NEWS_CATE_ID = String(sortVal)

    const result = await db.getList('news', where, {
        fields: 'NEWS_PIC,NEWS_VIEW_CNT,NEWS_TITLE,NEWS_DESC,NEWS_CATE_ID,NEWS_ADD_TIME,NEWS_ORDER,NEWS_STATUS,NEWS_CATE_NAME,NEWS_OBJ',
        orderBy: { NEWS_ORDER: 'asc' }, page, size
    })
    if (result.list) {
        result.list = result.list.map(item => ({
            type: 'news',
            id: item._id,
            title: item.NEWS_TITLE || '',
            desc: item.NEWS_DESC || '',
            ext: item.NEWS_CATE_NAME || '',
            pic: (item.NEWS_PIC && item.NEWS_PIC[0]) ? item.NEWS_PIC[0] : ''
        }))
    }
    return success(result)
}

async function viewNews(openId, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:公告ID' })
    if (vResult.err) return vResult.err

    const news = await db.getOne('news', { _id: vResult.data.id, NEWS_STATUS: 1 })
    return success(news || null)
}

module.exports = { getNewsList, viewNews }
