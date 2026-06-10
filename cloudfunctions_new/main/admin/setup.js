/**
 * 系统设置管理 + 小程序码生成
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */
const cloud = require('wx-server-sdk')
const db = require('../common/db')
const { validate } = require('../common/validate')
const { success, fail, CODE } = require('../common/response')
const { time } = require('../common/util')

async function setSetup(admin, params) {
    const vResult = validate(params, {
        key: 'key|required|string|desc:KEY',
        content: 'content|string|default:""'
    })
    if (vResult.err) return vResult.err

    await upsertSetup(vResult.data.key, vResult.data.content)
    return success()
}

async function setContentSetup(admin, params) {
    const vResult = validate(params, {
        id: 'id|required|string|desc:KEY',
        content: 'content|required|array|desc:内容'
    })
    if (vResult.err) return vResult.err

    await upsertSetup(vResult.data.id, vResult.data.content, 'content')
    return success()
}

async function genMiniQr(admin, params) {
    const vResult = validate(params, {
        path: 'path|required|string',
        sc: 'sc|string|default:qr'
    })
    if (vResult.err) return vResult.err

    let { path, sc } = vResult.data
    if (path.startsWith('/')) path = path.substring(1)

    try {
        const result = await cloud.openapi.wxacode.getUnlimited({
            scene: sc, width: 280, check_path: false, page: path
        })

        const crypto = require('crypto')
        const md5Path = crypto.createHash('md5').update(path).digest('hex')
        const cloudPath = 'workfit/setup/' + md5Path + '.png'

        const upload = await cloud.uploadFile({ cloudPath, fileContent: result.buffer })
        if (!upload || !upload.fileID) return fail(CODE.SVR, '上传小程序码失败')

        const tempRes = await cloud.getTempFileURL({ fileList: [upload.fileID] })
        const url = (tempRes.fileList && tempRes.fileList[0] && tempRes.fileList[0].tempFileURL) || ''
        return success(url + '?rd=' + time())
    } catch (e) {
        return fail(CODE.SVR, '生成小程序码失败: ' + (e.message || e))
    }
}

async function upsertSetup(key, val, type = '') {
    const existing = await db.coll('setup').where({ SETUP_KEY: key }).get()
    if (existing.data && existing.data.length > 0) {
        await db.edit('setup', { SETUP_KEY: key }, { SETUP_VALUE: { val }, SETUP_TYPE: type })
    } else {
        await db.insert('setup', { SETUP_KEY: key, SETUP_VALUE: { val }, SETUP_TYPE: type })
    }
}

module.exports = { setSetup, setContentSetup, genMiniQr }
