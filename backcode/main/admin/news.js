/**
 * 资讯公告管理（CRUD + 推荐 + 排序 + 富文本/图片更新）
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time, timestamp2Time } = require('../common/util')
const { insertLog } = require('./_helper')

async function getAdminNewsList(admin, params) {
    const { search, sortType, sortVal, page = 1, size = 20 } = params
    const where = {}

    if (search) where.NEWS_TITLE = db.regexp(search)
    if (sortType === 'cateId' && sortVal !== undefined) where.NEWS_CATE_ID = String(sortVal)
    if (sortType === 'status' && sortVal !== undefined) where.NEWS_STATUS = Number(sortVal)
    if (sortType === 'vouch') where.NEWS_VOUCH = 1
    if (sortType === 'top') where.NEWS_ORDER = 0

    const result = await db.getList('news', where, {
        fields: 'NEWS_TITLE,NEWS_DESC,NEWS_CATE_ID,NEWS_CATE_NAME,NEWS_ORDER,NEWS_STATUS,NEWS_VOUCH,NEWS_OBJ,ADD_TIME,EDIT_TIME',
        orderBy: { NEWS_ORDER: 'asc' }, page, size
    })
    if (result.list) {
        result.list = result.list.map(item => ({
            ...item,
            NEWS_ADD_TIME: item.ADD_TIME ? timestamp2Time(item.ADD_TIME) : '',
            NEWS_EDIT_TIME: item.EDIT_TIME ? timestamp2Time(item.EDIT_TIME) : ''
        }))
    }
    return success(result)
}

async function insertNews(admin, params) {
    const vResult = validate(params, {
        title: 'title|required|string|desc:标题',
        cateId: 'cateId|required|string|desc:分类',
        cateName: 'cateName|required|string|desc:分类名',
        order: 'order|int|default:9999',
        desc: 'desc|string|default:""',
        forms: 'forms|array|default:[]'
    })
    if (vResult.err) return vResult.err

    const { title, cateId, cateName, order, desc, forms } = vResult.data
    const id = await db.insert('news', {
        NEWS_TITLE: title, NEWS_CATE_ID: cateId, NEWS_CATE_NAME: cateName,
        NEWS_ORDER: order, NEWS_DESC: desc, NEWS_FORMS: forms,
        NEWS_STATUS: 1, NEWS_VOUCH: 0
    })

    insertLog(admin, '添加了公告【' + title + '】', 2)
    return success({ id })
}

async function delNews(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:公告ID' })
    if (vResult.err) return vResult.err

    const where = { _id: vResult.data.id }
    const news = await db.getOne('news', where, 'NEWS_TITLE')
    if (!news) return fail(CODE.DATA, '公告不存在')

    await db.del('news', where)
    insertLog(admin, '删除了公告【' + news.NEWS_TITLE + '】', 2)
    return success()
}

async function getNewsDetail(admin, params) {
    const vResult = validate(params, { id: 'id|required|string|desc:公告ID' })
    if (vResult.err) return vResult.err

    const news = await db.getOne('news', { _id: vResult.data.id })
    return success(news || null)
}

async function updateNewsForms(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        hasImageForms: 'hasImageForms|array|default:[]'
    })
    if (vResult.err) return vResult.err

    const { id, hasImageForms } = vResult.data
    if (!hasImageForms || hasImageForms.length === 0) return success()

    // 1. 读取当前 NEWS_FORMS
    const newsItem = await db.getOne('news', { _id: id }, 'NEWS_FORMS')
    const currentForms = (newsItem && newsItem.NEWS_FORMS) ? newsItem.NEWS_FORMS : []

    // 2. 合并图片 URL
    for (const updated of hasImageForms) {
        const idx = currentForms.findIndex(f => f.mark === updated.mark)
        if (idx >= 0) {
            currentForms[idx] = updated
        } else {
            currentForms.push(updated)
        }
    }

    // 3. 计算 NEWS_OBJ 并保存
    const obj = {}
    for (const f of currentForms) {
        if (f.mark) obj[f.mark] = f.val
    }
    await db.edit('news', { _id: id }, { NEWS_FORMS: currentForms, NEWS_OBJ: obj })
    return success()
}

async function updateNewsContent(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        content: 'content|required|array|desc:内容'
    })
    if (vResult.err) return vResult.err

    await db.edit('news', { _id: vResult.data.id }, { NEWS_CONTENT: vResult.data.content })
    return success()
}

async function updateNewsPic(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        imgList: 'imgList|required|array|desc:图片列表'
    })
    if (vResult.err) return vResult.err

    await db.edit('news', { _id: vResult.data.id }, { NEWS_PIC: vResult.data.imgList })
    return success()
}

async function editNews(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        title: 'title|required|string|desc:标题',
        cateId: 'cateId|required|string|desc:分类',
        cateName: 'cateName|required|string|desc:分类名',
        order: 'order|int|default:9999',
        desc: 'desc|string|default:""',
        forms: 'forms|array|default:[]'
    })
    if (vResult.err) return vResult.err

    const { id, title, cateId, cateName, order, desc, forms } = vResult.data
    await db.edit('news', { _id: id }, {
        NEWS_TITLE: title, NEWS_CATE_ID: cateId, NEWS_CATE_NAME: cateName,
        NEWS_ORDER: order, NEWS_DESC: desc, NEWS_FORMS: forms
    })
    return success()
}

async function statusNews(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        status: 'status|required|int|desc:状态'
    })
    if (vResult.err) return vResult.err

    await db.edit('news', { _id: vResult.data.id }, { NEWS_STATUS: vResult.data.status })
    return success()
}

async function sortNews(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        sort: 'sort|required|int|desc:排序值'
    })
    if (vResult.err) return vResult.err

    await db.edit('news', { _id: vResult.data.id }, { NEWS_ORDER: vResult.data.sort })
    return success()
}

async function vouchNews(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:公告ID',
        vouch: 'vouch|required|int|desc:推荐状态'
    })
    if (vResult.err) return vResult.err

    await db.edit('news', { _id: vResult.data.id }, { NEWS_VOUCH: vResult.data.vouch })
    return success()
}

module.exports = {
    getAdminNewsList, insertNews, delNews, getNewsDetail,
    updateNewsForms, updateNewsContent, updateNewsPic,
    editNews, statusNews, sortNews, vouchNews
}
