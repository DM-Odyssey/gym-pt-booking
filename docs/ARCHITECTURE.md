# 系统架构

微信小程序 + 云开发的单云函数架构，三端（用户、教练、管理后台）共用一套前后端代码。

## 架构图

```
┌─────────────────────────────────────────┐
│              用户端 / 教练端 / 管理端      │  frontcode/
├─────────────────────────────────────────┤
│   services/ → utils/cloud.js             │  业务封装 → 云函数调用
├─────────────────────────────────────────┤
│         wx.cloud.callFunction            │  wx-server-sdk
├─────────────────────────────────────────┤
│           backcode/main/index.js         │  路由入口
├─────────────────────────────────────────┤
│    passport/  home/  news/  meet/        │  模块分发
│         admin/  work/                    │
├─────────────────────────────────────────┤
│     common/ (auth, db, response, ...)    │  公共层
│     数据库: bx_* 集合                    │  云开发数据库
└─────────────────────────────────────────┘
```

## 前端架构

### 页面模式

所有页面使用 `Component()` 而非 `Page()`，实现更好的封装和复用。

### 模块划分

```
frontcode/
├── pages/          # 页面（按角色分目录）
├── services/       # 业务 API 封装（auth, admin, work, meet, news, user, common）
├── utils/          # 工具函数（cloud, router, validate, cache, time, data, helper...）
├── components/     # 组件
│   ├── public/     #   通用（calendar, list, form, editor, picker, modal, image, poster）
│   └── business/   #   业务（detail, foot）
├── config/         # 配置（setting.js: CLOUD_ID, 版本等）
└── templates/      # WXML 模板
```

### 云函数调用

通过 `utils/cloud.js` 统一封装：

- `callCloudData(route, params, opts)` — 查询数据
- `callCloudSubmit(route, params, opts)` — 提交数据
- `dataList(that, listName, route, params)` — 分页列表

**Token 自动选择**：根据路由前缀自动附加对应 Token（`admin/` → 管理员，`work/` → 教练，其余 → 用户）。

## 后端架构

### 路由分发

单云函数 `main`，通过 `index.js` 按路由前缀分发到各模块：

| 前缀 | 模块 | 鉴权 | 说明 |
|------|------|------|------|
| `passport/` | passport.js | 用户 OpenID | 登录注册 |
| `home/` | home.js | 无 | 首页数据 |
| `news/` | news.js | 无 | 公告列表 |
| `meet/` | meet.js | 用户 | 预约操作 |
| `admin/` | admin/index.js | Admin Token | 管理后台 |
| `work/` | work/index.js | Work Token | 教练端 |

### 模块结构

每个模块遵循统一模式：

```
module/
├── index.js     # 路由表：route → [handler, ...middlewares]
└── xxx.js       # 业务逻辑函数
```

### 公共层

| 文件 | 职责 |
|------|------|
| `common/auth.js` | Token 鉴权（checkAdmin / checkWork / checkUser） |
| `common/db.js` | 数据库 CRUD 封装（自动时间戳 + IP + 集合前缀） |
| `common/validate.js` | 参数校验声明式规则 |
| `common/response.js` | 统一响应格式 + 错误码定义 |
| `common/util.js` | 工具函数（时间 UTC+8、随机串、密码） |

### 错误码

| 错误码 | 含义 |
|--------|------|
| 200 | 成功 |
| 1301 | 参数校验失败 |
| 1600 | 业务逻辑错误 |
| 2401 | 管理员认证失败（触发前端 reLaunch 到登录页） |
| 2501 | 教练认证失败（触发前端 reLaunch 到登录页） |
| 500 | 服务器错误 |

## 数据库设计

集合前缀 `bx_`，共 12 个集合。`db.insert()` 自动添加 `ADD_TIME`、`EDIT_TIME`（epoch 秒，北京时间 UTC+8）和 `ADD_IP`、`EDIT_IP`。

| 集合 | 用途 | 核心字段 |
|------|------|----------|
| `bx_admin` | 管理员 | ADMIN_ID, ADMIN_PWD, ADMIN_NAME, ADMIN_TYPE, ADMIN_STATUS |
| `bx_user` | 用户 | USER_MINI_OPENID, USER_NAME, USER_MOBILE, USER_STATUS, USER_FORMS |
| `bx_meet` | 课程/教练 | MEET_TITLE, MEET_PHONE, MEET_CATE_ID, MEET_OBJ, MEET_COST_MODE |
| `bx_day` | 排期 | DAY_MEET_ID, day, times[] |
| `bx_join` | 预约记录 | JOIN_USER_ID, JOIN_MEET_ID, JOIN_MEET_DAY, JOIN_STATUS, JOIN_IS_CHECKIN |
| `bx_temp` | 时段模板 | TEMP_NAME, TEMP_TIMES[], TEMP_MEET_ID |
| `bx_news` | 公告 | NEWS_TITLE, NEWS_CONTENT, NEWS_OBJ, NEWS_VOUCH |
| `bx_log` | 操作日志 | LOG_CONTENT, LOG_TYPE, LOG_ADMIN_ID |
| `bx_setup` | 系统配置 | SETUP_KEY, SETUP_VALUE |
| `bx_card` | 健身卡 | CARD_USER_ID, CARD_TYPE, CARD_TOTAL, CARD_USED, CARD_EXPIRE |
| `bx_card_log` | 卡消费日志 | LOG_CARD_ID, LOG_USER_ID, LOG_TYPE, LOG_CNT |

## 鉴权流程

```
用户端：微信 OpenID → passport/my_detail → 静默登录
教练端：手机号+密码 → work/login → 返回 Token（存前端缓存）
管理端：账号+密码 → admin/login → 返回 Token（存前端缓存）
```

Token 存储在数据库（bx_meet.MEET_TOKEN / bx_admin.ADMIN_TOKEN），前端通过 `utils/cache.js` 缓存。每次请求自动附加 Token 到 `event.token`，后端 `auth.js` 验证。

## 健身卡系统

- 三种卡片：**私教卡**（消耗教练预约）、**课程卡**（消耗课程预约）、**健身卡**（通用）
- 卡类型优先级：专属卡（私教卡/课程卡）> 通用卡（健身卡）
- 消耗模式：预约时自动扣减，原子操作 `db.cmd().inc(-1)`
- 同类型已有有效卡时追加次数，不新建
