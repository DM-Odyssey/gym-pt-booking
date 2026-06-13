const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, CODE } = require('../common/response')

async function getHomeList(openId, params) {
    // ========== 1. 最新公告 ==========
    const retList = await db.getAll('news', { NEWS_STATUS: 1 }, {
        fields: 'NEWS_PIC,NEWS_CATE_NAME,NEWS_TITLE,NEWS_DESC,NEWS_ADD_TIME',
        orderBy: { field: 'NEWS_ORDER', direction: 'asc' }, limit: 10
    })
    const list = (retList || []).map(item => ({
        type: 'news',
        ext: item.NEWS_CATE_NAME || '',
        title: item.NEWS_TITLE || '',
        id: item._id,
        desc: item.NEWS_DESC || '',
        pic: item.NEWS_PIC || ''
    }))

    // ========== 2. 教练团队 & 3. 推荐课程 ==========
    let coachList = []
    let courseList = []
    try {
        // 直接用原生查询，不走 getAll
        const coll = db.coll('meet')
        const res = await coll.where({}).limit(20).get()
        const allMeets = res.data || []
        console.log('=== home/list meet total:', allMeets.length)

        for (const item of allMeets) {
            const pic = (item.MEET_OBJ && item.MEET_OBJ.cover && item.MEET_OBJ.cover[0]) ? item.MEET_OBJ.cover[0] : ''
            const base = {
                id: item._id,
                title: item.MEET_TITLE || '',
                pic,
                desc: (item.MEET_OBJ && item.MEET_OBJ.desc) ? item.MEET_OBJ.desc : ''
            }

            // 教练：cateId == 1
            if (item.MEET_CATE_ID == 1 || item.MEET_CATE_ID === '1') {
                coachList.push(base)
            }

            // 课程预约：非私教的所有课程
            if (item.MEET_CATE_ID != 1 && item.MEET_CATE_ID !== '1') {
                courseList.push({ ...base, cate: item.MEET_CATE_NAME || '' })
            }
        }
        console.log('=== home/list coach:', coachList.length, 'course:', courseList.length)
    } catch (e) {
        console.error('home/list meet query error:', e)
    }

    return success({ list, coachList, courseList })
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
