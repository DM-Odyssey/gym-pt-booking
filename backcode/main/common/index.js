/**
 * common 公共模块
 *
 * 使用：require('common')
 */
module.exports = {
    db: require('./db'),
    auth: require('./auth'),
    response: require('./response'),
    util: require('./util'),
    validate: require('./validate'),
}
