/**
 * 数据校验工具
 * 每个云函数自己定义校验规则，调用 validate() 统一校验
 *
 * 规则格式：
 *   fieldName: 'required|type|min:5|max:30|desc:管理员名'
 *
 * 支持的类型：string, int, array, object, bool
 * 支持的校验：required, min, max, len, in:a,b,c
 */

const { fail, CODE } = require('./response')
const { isDefined } = require('./util')

function validate(data, rules) {
    const result = {}

    for (const [key, rule] of Object.entries(rules)) {
        const parts = rule.split('|')
        let fieldName = parts[0]        // 数据中的字段名
        const required = parts.includes('required')
        let type = 'string'
        let desc = key
        let min, max, len, inValues, defVal

        for (const p of parts) {
            if (['string', 'int', 'array', 'object', 'bool'].includes(p)) type = p
            if (p.startsWith('desc:')) desc = p.replace('desc:', '')
            if (p.startsWith('min:')) min = Number(p.replace('min:', ''))
            if (p.startsWith('max:')) max = Number(p.replace('max:', ''))
            if (p.startsWith('len:')) len = Number(p.replace('len:', ''))
            if (p.startsWith('in:')) inValues = p.replace('in:', '').split(',')
            if (p.startsWith('default:')) defVal = JSON.parse(p.replace('default:', ''))
        }

        let val = data[fieldName] !== undefined ? data[fieldName] : defVal

        // 必填检查
        if (required && !isDefined(val) && val !== 0) {
            return { err: fail(CODE.DATA, `${desc}不能为空`) }
        }

        // 如果没值且非必填，用默认值
        if (!isDefined(val)) {
            result[key] = defVal
            continue
        }

        // 类型转换和校验
        switch (type) {
            case 'int':
                val = Number(val)
                if (isNaN(val)) return { err: fail(CODE.DATA, `${desc}必须为数字`) }
                break
            case 'string':
                val = String(val).trim()
                break
            case 'array':
                if (!Array.isArray(val)) {
                    return { err: fail(CODE.DATA, `${desc}必须为数组`) }
                }
                break
            case 'object':
                if (typeof val !== 'object' || Array.isArray(val)) {
                    return { err: fail(CODE.DATA, `${desc}必须为对象`) }
                }
                break
            case 'bool':
                val = Boolean(val)
                break
        }

        // 长度/范围校验
        if (min !== undefined) {
            if (type === 'string' && val.length < min) return { err: fail(CODE.DATA, `${desc}不能少于${min}位`) }
            if (type === 'int' && val < min) return { err: fail(CODE.DATA, `${desc}不能小于${min}`) }
            if (type === 'array' && val.length < min) return { err: fail(CODE.DATA, `${desc}不能少于${min}项`) }
        }
        if (max !== undefined) {
            if (type === 'string' && val.length > max) return { err: fail(CODE.DATA, `${desc}不能超过${max}位`) }
            if (type === 'int' && val > max) return { err: fail(CODE.DATA, `${desc}不能大于${max}`) }
        }
        if (len !== undefined) {
            if (String(val).length !== len) return { err: fail(CODE.DATA, `${desc}长度必须为${len}位`) }
        }
        if (inValues && !inValues.includes(String(val))) {
            return { err: fail(CODE.DATA, `${desc}取值不在允许范围内`) }
        }

        result[key] = val
    }

    return { data: result }
}

module.exports = { validate }
