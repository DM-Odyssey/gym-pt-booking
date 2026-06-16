# API 接口文档

所有接口通过云函数 `main` 调用，路由格式为 `event.route`，参数通过 `event.params` 传递。

## 通用说明

| 项目 | 说明 |
|------|------|
| 调用方式 | `wx.cloud.callFunction({ name: 'main', data: { route, params, token } })` |
| 鉴权方式 | 后端从 event.token 读取，自动验证身份 |
| 时间格式 | 所有返回时间为 `YYYY-MM-DD HH:mm:ss`（北京时间） |
| 集合前缀 | `bx_` |

### 响应格式

```json
{ "code": 200, "data": { ... } }       // 成功
{ "code": 1600, "msg": "错误信息" }     // 业务错误
{ "code": 2401 }                        // 管理员认证失败
{ "code": 2501 }                        // 教练认证失败
```

---

## Passport（用户认证）

| 路由 | 鉴权 | 参数 | 说明 |
|------|------|------|------|
| `passport/register` | 否 | name, phone, forms | 用户注册 |
| `passport/my_detail` | user | — | 获取个人信息 |
| `passport/edit_base` | user | name, phone, forms | 编辑资料 |
| `passport/my_card` | user | — | 获取我的健身卡 |
| `passport/phone` | user | cloudID | 微信手机号获取 |

## Home（首页）

| 路由 | 鉴权 | 参数 | 说明 |
|------|------|------|------|
| `home/list` | 否 | — | 首页数据（公告+教练+课程） |
| `home/setup_get` | 否 | key | 获取系统配置项 |

## News（公告）

| 路由 | 鉴权 | 参数 | 说明 |
|------|------|------|------|
| `news/list` | 否 | cateId, search, page, size | 公告列表 |
| `news/view` | 否 | id | 公告详情 |

## Meet（用户预约）

| 路由 | 鉴权 | 参数 | 说明 |
|------|------|------|------|
| `meet/list` | 否 | page, size | 课程列表 |
| `meet/list_by_day` | 否 | day | 按日期查课程 |
| `meet/view` | 否 | id | 课程详情（含排期） |
| `meet/before_join` | user | meetId, timeMark | 预约前置检查 |
| `meet/detail_for_join` | user | meetId, timeMark | 预约确认页数据 |
| `meet/join` | user | meetId, timeMark, forms | 提交预约 |
| `meet/my_join_list` | user | status, page, size | 我的预约列表 |
| `meet/my_join_detail` | user | joinId | 预约详情 |
| `meet/my_join_cancel` | user | joinId, reason | 取消预约 |

## Admin（管理后台）

> 所有 admin/ 路由需 Admin Token 鉴权，`admin/login` 除外。

### 管理员管理

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/login` | id, pwd | 管理员登录 |
| `admin/home` | — | 仪表盘数据 |
| `admin/mgr_list` | search, sortType, sortVal, page, size | 管理员列表 |
| `admin/mgr_insert` | name, password, desc, phone | 新增管理员 |
| `admin/mgr_edit` | id, name, password, desc, phone | 编辑管理员 |
| `admin/mgr_del` | id | 删除管理员 |
| `admin/mgr_status` | id, status | 启用/禁用 |
| `admin/mgr_pwd` | id, password | 重置密码 |

### 课程管理

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/meet_list` | search, sortType, sortVal, page, size | 课程列表 |
| `admin/meet_insert` | title, cateId, cateName, order, cancelSet, daysSet, costMode, forms, joinForms, phone, password | 新建课程 |
| `admin/meet_detail` | id | 课程详情 |
| `admin/meet_edit` | id, title, cateId, cateName, order, cancelSet, daysSet, costMode, forms, joinForms, phone, password | 编辑课程 |
| `admin/meet_del` | id | 删除课程 |
| `admin/meet_status` | id, status | 启用/停用 |
| `admin/meet_update_forms` | id, hasImageForms | 更新含图片表单 |
| `admin/meet_day_list` | meetId, start, end | 排期列表 |
| `admin/meet_set_days` | meetId, daysSet | 设置排期 |

### 预约管理

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/meet_join_list` | meetId, mark, search, sortType, sortVal, page, size | 预约名单 |
| `admin/join_status` | joinId, status, reason | 预约状态变更 |
| `admin/join_del` | joinId | 删除预约 |
| `admin/join_scan` | code | 扫码核销 |
| `admin/join_checkin` | joinId, flag | 手动签到/取消 |
| `admin/meet_cancel_time_join` | meetId, timeMark, reason | 取消整时段 |
| `admin/self_checkin_qr` | meetId, timeMark | 生成自助核销码 |

### 预约数据导出

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/join_data_export` | meetId, mark, condition, fields | 导出 Excel |
| `admin/join_data_get` | meetId, mark | 获取导出文件 URL |
| `admin/join_data_del` | meetId, mark | 删除导出文件 |

### 时段模板

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/meet_temp_list` | meetId | 模板列表 |
| `admin/meet_temp_insert` | name, times | 新建模板 |
| `admin/meet_temp_edit` | id, limit, isLimit | 编辑模板 |
| `admin/meet_temp_del` | id | 删除模板 |

### 用户管理

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/user_list` | search, sortType, sortVal, page, size | 用户列表 |
| `admin/user_detail` | id | 用户详情 |
| `admin/user_del` | id | 删除用户 |
| `admin/user_status` | id, status, reason | 用户状态变更 |
| `admin/user_data_export` | condition, fields | 导出用户数据 Excel |
| `admin/user_data_get` | — | 获取导出文件 URL |
| `admin/user_data_del` | — | 删除导出文件 |

### 健身卡管理

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/card_list` | search, cardType, cardStatus, page, size | 卡列表 |
| `admin/card_add` | userId, cardType, total, expire, memo | 发卡 |
| `admin/card_edit` | cardId, addTotal, expire, status, memo | 编辑卡 |
| `admin/card_del` | cardId | 删除卡 |
| `admin/card_user` | userId | 查询用户卡 |
| `admin/card_log` | cardId, userId, page, size | 卡消费日志 |

### 公告管理

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/news_list` | search, sortType, sortVal, page, size | 公告列表 |
| `admin/news_insert` | title, cateId, cateName, order, desc, forms | 新建公告 |
| `admin/news_edit` | id, title, cateId, cateName, order, desc, forms | 编辑公告 |
| `admin/news_detail` | id | 公告详情 |
| `admin/news_del` | id | 删除公告 |
| `admin/news_status` | id, status | 启用/停用 |
| `admin/news_sort` | id, sort | 排序 |
| `admin/news_vouch` | id, vouch | 推荐/取消推荐 |
| `admin/news_update_forms` | id, hasImageForms | 更新表单 |
| `admin/news_update_pic` | id, imgList | 更新图片 |
| `admin/news_update_content` | id, content | 更新内容 |

### 日志与设置

| 路由 | 参数 | 说明 |
|------|------|------|
| `admin/log_list` | search, sortType, sortVal, page, size | 操作日志 |
| `admin/log_clear` | — | 清空日志 |
| `admin/setup_set` | key, value | 设置配置 |
| `admin/setup_set_content` | key, content | 设置富文本配置 |
| `admin/setup_qr` | title, qr | 生成小程序码 |
| `admin/clear_vouch` | — | 清除推荐标记 |

---

## Work（教练端）

> 所有 work/ 路由需 Work Token 鉴权，`work/login` 除外。

| 路由 | 鉴权 | 参数 | 说明 |
|------|------|------|------|
| `work/login` | 否 | phone, pwd | 教练登录 |
| `work/home` | work | — | 工作台数据 |
| `work/pwd` | work | oldPassword, password | 修改密码 |
| `work/meet_detail` | work | — | 课程详情 |
| `work/meet_edit` | work | id, title, cateId, cateName, order, cancelSet, daysSet, costMode, forms, joinForms, phone, password | 编辑课程 |
| `work/meet_update_forms` | work | id, hasImageForms | 更新表单 |
| `work/meet_day_list` | work | meetId, start, end | 排期列表 |
| `work/meet_join_list` | work | meetId, mark, sortType, sortVal, page, size | 预约名单 |
| `work/join_status` | work | joinId, status, reason | 预约状态 |
| `work/join_del` | work | joinId | 删除预约 |
| `work/join_scan` | work | code | 扫码核销 |
| `work/join_checkin` | work | joinId, flag | 签到/取消签到 |
| `work/meet_cancel_time_join` | work | meetId, timeMark, reason | 取消整时段 |
| `work/meet_temp_list` | work | meetId | 模板列表 |
| `work/meet_temp_insert` | work | name, times | 新建模板 |
| `work/meet_temp_edit` | work | id, limit, isLimit | 编辑模板 |
| `work/meet_temp_del` | work | id | 删除模板 |
