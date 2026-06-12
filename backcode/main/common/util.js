/**
 * 工具函数 — 时间/ID/bcrypt 密码
 * Author: bjzm-mrzdp
 * Date: 2026-06-10
 */

const crypto = require('crypto')

// 获取当前时间戳（秒）
function time() {
    return Math.floor(Date.now() / 1000)
}

// 时间戳转格式化字符串
function timestamp2Time(ts, format = 'Y-M-D h:m:s') {
    if (!ts || ts === 0) return ''
    const d = new Date(ts * 1000)
    const Y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return format
        .replace('Y', Y).replace('M', M).replace('D', D)
        .replace('h', h).replace('m', m).replace('s', s)
}

// 获取当前日期字符串 YYYY-MM-DD
function today() {
    return timestamp2Time(time(), 'Y-M-D')
}

// 生成随机字符串
function genRandomString(len = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// 生成唯一 ID
function makeID() {
    return Date.now().toString(36) + genRandomString(16)
}

// 判断值是否有效
function isDefined(val) {
    return val !== undefined && val !== null
}

// ===== 密码处理（bcrypt）=====

const bcrypt = require('bcryptjs')
const SALT_ROUNDS = 10

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS)
}

async function verifyPassword(password, storedHash) {
    if (!storedHash) return false
    return await bcrypt.compare(password, storedHash)
}

module.exports = {
    time, timestamp2Time, today,
    genRandomString, makeID, isDefined,
    hashPassword, verifyPassword
}
