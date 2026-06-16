/**
 * 前端参数校验模块
 * Author: DM-Odyssey
 * Date: 2026-06-11
 *
 * 规则格式：'formFieldName|must|string|min:1|max:50|name=昵称'
 *  - formFieldName: 数据中对应的字段名（也是返回数据的键名）
 *  - name=xxx: 字段中文名（用于错误提示）
 *  - default=xxx: 默认值
 *  - 类型标记: string/str, int, digit, array/arr, object/obj, bool/boolean
 *  - 校验规则: must, min:N, max:N, len:N, in:a,b,c, mobile, email, date, time, datetime, year, yearmonth, hourminute, money, id, letter, letter_num
 */

const { showModal } = require('./toast.js');

/** 获取数据类型 */
const getType = (value) => {
  if (value === null || value === undefined) return value;
  return value.constructor;
};

/** 是否为空 */
const isNull = (value) => {
  if (value === null || value === undefined) return true;
  if (getType(value) === String && value === '') return true;
  return false;
};

/** 是否为空（含空数组） */
const isStrAndArrNull = (value) => {
  if (value === null || value === undefined) return true;
  const type = getType(value);
  if (type === String && value === '') return true;
  if (type === Array && value.length === 0) return true;
  return false;
};

// ===== 校验函数 =====

const checkRequired = (value, desc) => {
  switch (getType(value)) {
    case Object: if (JSON.stringify(value) === '{}') return `${desc}不能为空`; break;
    case Array: if (value.length === 0) return `${desc}不能为空`; break;
    case String: if (value.length === 0) return `${desc}不能为空`; break;
    case null:
    case undefined: return `${desc}不能为空`;
  }
  return '';
};

const checkMin = (value, min, desc) => {
  if (isStrAndArrNull(value)) return '';
  min = Number(min);
  switch (getType(value)) {
    case Array: if (value.length < min) return `${desc}不能少于${min}项`; break;
    case String: if (value.length < min) return `${desc}不能少于${min}位`; break;
    case Number: if (value < min) return `${desc}不能小于${min}`; break;
  }
  return '';
};

const checkMax = (value, max, desc) => {
  if (isStrAndArrNull(value)) return '';
  max = Number(max);
  switch (getType(value)) {
    case Array: if (value.length > max) return `${desc}不能多于${max}项`; break;
    case String: if (value.length > max) return `${desc}不能多于${max}位`; break;
    case Number: if (value > max) return `${desc}不能大于${max}`; break;
  }
  return '';
};

const checkLen = (value, len, desc) => {
  if (isStrAndArrNull(value)) return '';
  len = Number(len);
  switch (getType(value)) {
    case Array: if (value.length !== len) return `${desc}必须为${len}项`; break;
    case String: if (value.length !== len) return `${desc}必须为${len}位`; break;
  }
  return '';
};

const checkMobile = (value, desc) => {
  if (isNull(value)) return '';
  if (!/^1[1-9]\d{9}$/.test(value)) return `${desc}格式不正确`;
  return '';
};

const checkInt = (value, desc) => {
  if (isNull(value)) return '';
  if (!/^[0-9]+$/.test(value)) return `${desc}必须为数字`;
  return '';
};

const checkDigit = (value, desc) => {
  if (isNull(value)) return '';
  if (!/^\d+(\.\d+)?$/.test(value)) return `${desc}必须为数字或小数`;
  return '';
};

const checkLetter = (value, desc) => {
  if (isNull(value)) return '';
  if (!/^[A-Za-z]+$/.test(value)) return `${desc}必须为字母`;
  return '';
};

const checkLetterNum = (value, desc) => {
  if (isNull(value)) return '';
  if (!/^\w+$/.test(value)) return `${desc}必须为字母、数字和下划线`;
  return '';
};

const checkMoney = (value, desc) => {
  if (isNull(value)) return '';
  if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(value))
    return `${desc}必须为金额格式，例如2.00`;
  return '';
};

const checkId = (value, desc, min = 1, max = 100) => {
  if (isNull(value)) return '';
  if (getType(value) !== String) return `${desc}必须为ID字符串格式`;
  if (value.length < min || value.length > max) return `${desc}必须为ID格式`;
  return '';
};

const checkEmail = (value, desc) => {
  if (isNull(value)) return '';
  if (!/^[A-Za-z0-9+]+[A-Za-z0-9.\-_+]*@([A-Za-z0-9-]+\.)+[A-Za-z0-9]+$/.test(value))
    return `${desc}必须为邮箱格式`;
  return '';
};

const checkDate = (value, desc) => {
  if (isNull(value)) return '';
  if (value.length !== 10) return `请选择${desc}`;
  const r = value.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
  if (!r) return `请选择${desc}`;
  const d = new Date(r[1], r[3] - 1, r[4]);
  if (d.getFullYear() != r[1] || (d.getMonth() + 1) != r[3] || d.getDate() != r[4])
    return `请选择${desc}`;
  return '';
};

const checkYear = (value, desc) => {
  if (isNull(value)) return '';
  if (value.length !== 4) return `请选择${desc}`;
  return checkDate(value + '-01-01', desc);
};

const checkYearMonth = (value, desc) => {
  if (isNull(value)) return '';
  if (value.length !== 7) return `请选择${desc}`;
  return checkDate(value + '-01', desc);
};

const checkTime = (value, desc) => {
  if (isNull(value)) return '';
  if (value.length !== 8) return `${desc}必须为时间格式`;
  const a = value.match(/^(\d{1,2})(:)?(\d{1,2})\2(\d{1,2})$/);
  if (!a || a[1] > 23 || a[3] > 59 || a[4] > 59) return `${desc}必须为时间格式`;
  return '';
};

const checkHourMinute = (value, desc) => {
  if (isNull(value)) return '';
  if (value.length !== 5) return `${desc}必须为时分时间格式`;
  return checkTime(value + ':01', desc);
};

const checkDateTime = (value, desc) => {
  if (isNull(value)) return '';
  if (value.length !== 19) return `${desc}必须为完整时间格式`;
  const r = value.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (!r) return `${desc}必须为完整时间格式`;
  const d = new Date(r[1], r[3] - 1, r[4], r[5], r[6], r[7]);
  if (d.getFullYear() != r[1] || (d.getMonth() + 1) != r[3] || d.getDate() != r[4] ||
      d.getHours() != r[5] || d.getMinutes() != r[6] || d.getSeconds() != r[7])
    return `${desc}必须为完整时间格式`;
  return '';
};

const checkArray = (value, desc) => {
  if (!Array.isArray(value)) return `${desc}填写错误`;
  return '';
};

const checkObject = (value, desc) => {
  if (getType(value) !== Object) return `${desc}填写错误`;
  return '';
};

const checkBoolean = (value, desc) => {
  if (getType(value) !== Boolean) return `${desc}填写错误`;
  return '';
};

const checkString = (value, desc) => {
  if (getType(value) !== String) return `${desc}填写错误`;
  return '';
};

const checkIn = (value, ref, desc) => {
  if (isNull(value)) return '';
  const type = getType(value);
  if (type !== String && type !== Number) return `${desc}填写范围错误`;
  const arr = String(ref).split(',');
  if (!arr.includes(value) && !arr.includes(String(value))) return `${desc}填写范围错误`;
  return '';
};

/** 显示校验错误 */
const showError = (result, formName, that) => {
  wx.showModal({
    title: '温馨提示',
    content: result,
    showCancel: false,
    success: () => {
      if (that) {
        try {
          const query = wx.createSelectorQuery().in(that);
          query.select('#' + formName).boundingClientRect();
          query.selectViewport().scrollOffset();
          query.exec((res) => {
            if (res && res[0] && res[1]) {
              const target = res[1].scrollTop + res[0].top - 10;
              wx.pageScrollTo({ scrollTop: target, duration: 300 });
            }
          });
        } catch (e) { /* ignore */ }
        that.setData({ [formName + 'Focus']: result });
      }
    },
  });
};

/**
 * 主校验入口
 * @param {Object} data - 待校验数据
 * @param {Object} rules - 校验规则 { outputKey: 'formField|rule1|rule2|...' }
 * @param {Object} that - 页面/组件 this（用于自动聚焦和错误提示）
 * @returns {Object|false} 校验通过返回处理后的数据，失败返回 false
 */
const check = (data, rules, that) => {
  const returnData = {};

  for (const key in rules) {
    const arr = rules[key].split('|');

    // arr[0] 是表单字段名（data 中的键），也是返回数据的键
    const formName = arr[0];
    let desc = formName;
    let defVal = undefined;
    let dataType = 'String';

    // 第一遍扫描：提取 name 和 default
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].startsWith('name=')) {
        desc = '「' + arr[i].replace('name=', '') + '」';
      } else if (arr[i].startsWith('default=')) {
        defVal = arr[i].replace('default=', '').trim();
      } else {
        // 识别数据类型
        switch (arr[i].toLowerCase()) {
          case 'int':
          case 'digit': dataType = 'Number'; break;
          case 'array':
          case 'arr': dataType = 'Array'; break;
          case 'object':
          case 'obj': dataType = 'Object'; break;
          case 'bool':
          case 'boolean': dataType = 'Boolean'; break;
        }
      }
    }

    let val = data[formName];

    // 类型转换与默认值
    switch (dataType) {
      case 'Array': {
        if (defVal !== undefined) {
          try { defVal = JSON.parse(defVal); if (!Array.isArray(defVal)) { showError(desc + '默认值数组格式错误', formName, that); return false; } }
          catch (ex) { showError(desc + '默认值数组格式错误', formName, that); return false; }
        }
        if (val === null || val === undefined) val = defVal;
        if (val !== undefined && !Array.isArray(val)) { showError(desc + '数组格式错误', formName, that); return false; }
        break;
      }
      case 'Object': {
        if (defVal !== undefined) {
          try { defVal = JSON.parse(defVal); if (getType(defVal) !== Object) { showError(desc + '默认值对象格式错误', formName, that); return false; } }
          catch (ex) { showError(desc + '默认值对象格式错误', formName, that); return false; }
        }
        if (val === null || val === undefined) val = defVal;
        if (val !== undefined && getType(val) !== Object) { showError(desc + '对象格式错误', formName, that); return false; }
        break;
      }
      case 'Boolean': {
        if (defVal !== undefined) {
          try { defVal = JSON.parse(defVal); if (getType(defVal) !== Boolean) { showError(desc + '默认值布尔格式错误', formName, that); return false; } }
          catch (ex) { showError(desc + '默认值布尔格式错误', formName, that); return false; }
        }
        if (val === null || val === undefined) val = defVal;
        if (val !== undefined && getType(val) !== Boolean) { showError(desc + '布尔格式错误', formName, that); return false; }
        break;
      }
      case 'Number': {
        if (defVal !== undefined && checkDigit(defVal, desc + '默认值')) { showError(desc + '默认值格式错误', formName, that); return false; }
        if (val === null || val === undefined) val = defVal;
        if (val === undefined) break;
        if (val === '') { showError(desc + '不能为空', formName, that); return false; }
        const type = getType(val);
        if (type === Object || type === Boolean || type === Array) { showError(desc + '必须为数字格式', formName, that); return false; }
        const digitResult = checkDigit(val, desc);
        if (digitResult) { showError(digitResult, formName, that); return false; }
        val = Number(val);
        break;
      }
      case 'String': {
        const type = getType(val);
        if (type === Object || type === Boolean || type === Array) { showError(desc + '必须为字符串格式', formName, that); return false; }
        if (val === null || val === undefined) val = defVal;
        if (val === undefined) break;
        try { val = String(val).trim(); } catch (ex) { showError(desc + '必须为字符串格式', formName, that); return false; }
        break;
      }
    }

    returnData[key] = val;

    // 第二遍扫描：逐规则校验（跳过 name=、default=、类型标记、表单字段名）
    for (let i = 1; i < arr.length; i++) {
      const ruleParts = arr[i].split(':');
      const ruleName = ruleParts[0].toLowerCase();

      // 跳过非校验标记
      if (['name', 'default', 'string', 'str', 'int', 'digit', 'array', 'arr', 'object', 'obj', 'bool', 'boolean'].includes(ruleName)) continue;

      // 空值且非必填，跳过后续校验
      if (ruleName !== 'must' && val === undefined) continue;

      let result = '';
      switch (ruleName) {
        case 'must': result = checkRequired(val, desc); break;
        case 'min': result = checkMin(val, Number(ruleParts[1]), desc); break;
        case 'max': result = checkMax(val, Number(ruleParts[1]), desc); break;
        case 'len': result = checkLen(val, Number(ruleParts[1]), desc); break;
        case 'in': result = checkIn(val, ruleParts[1], desc); break;
        case 'mobile': result = checkMobile(val, desc); break;
        case 'email': result = checkEmail(val, desc); break;
        case 'date': result = checkDate(val, desc); break;
        case 'time': result = checkTime(val, desc); break;
        case 'hourminute': result = checkHourMinute(val, desc); break;
        case 'datetime': result = checkDateTime(val, desc); break;
        case 'year': result = checkYear(val, desc); break;
        case 'yearmonth': result = checkYearMonth(val, desc); break;
        case 'money': result = checkMoney(val, desc); break;
        case 'id': result = checkId(val, desc); break;
        case 'letter': result = checkLetter(val, desc); break;
        case 'letter_num': result = checkLetterNum(val, desc); break;
        // 类型标记已在第一遍处理，跳过
        case 'string':
        case 'str':
        case 'array':
        case 'arr':
        case 'object':
        case 'obj':
        case 'bool':
        case 'boolean':
        case 'int':
        case 'digit': continue;
        default: {
          // 可能是表单字段名（即 arr[0] 作为规则首元素的情况）
          if (i === 1) continue; // 第一个规则元素如果不在已知列表中，当作字段名跳过
        }
      }

      if (result) {
        showError(result, formName, that);
        return false;
      }
    }
  }

  return returnData;
};

module.exports = {
  check,
  // 暴露单项校验函数
  checkString,
  checkArray,
  checkObject,
  checkBoolean,
  checkMoney,
  checkYear,
  checkYearMonth,
  checkDate,
  checkTime,
  checkHourMinute,
  checkDateTime,
  checkMin,
  checkMax,
  checkLen,
  checkIn,
  checkEmail,
  checkMobile,
  checkInt,
  checkDigit,
  checkId,
  checkLetter,
  checkLetterNum,
  checkRequired,
};
