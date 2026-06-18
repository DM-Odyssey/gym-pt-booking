# 开发指南

## 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) | 最新版 | 前端开发与调试 |
| Node.js | ≥14 | 云函数依赖安装 |
| 微信小程序账号 | — | 申请小程序 AppID |
| 微信云开发 | — | 开通云数据库 + 云存储 |

## 项目搭建

```bash
# 1. 克隆代码
git clone <repo-url> && cd MiniHesuan

# 2. 切换到开发分支（含真实配置）
git checkout dev

# 3. 安装云函数依赖
cd backcode/main && npm install

# 4. 在微信开发者工具中导入项目
#    - 项目目录：项目根目录
#    - AppID：填写你的小程序 AppID

# 5. 配置云环境
#    打开 frontcode/config/setting.js，修改 CLOUD_ID 为你的云环境 ID
```

## 项目结构

```
frontcode/                # 前端
├── pages/                #   页面（按角色分目录）
├── services/             #   业务 API 封装
├── utils/                #   工具函数
├── components/           #   组件
│   ├── public/           #     通用组件
│   └── business/         #     业务组件
├── config/setting.js     #   配置文件
└── app.json              #   页面注册

backcode/main/            # 后端云函数
├── index.js              #   路由分发入口
├── common/               #   公共层（auth, db, response, validate, util）
├── admin/                #   管理端模块
├── work/                 #   教练端模块
├── meet/                 #   用户预约模块
├── passport/             #   认证模块
├── home/                 #   首页模块
└── news/                 #   公告模块
```

## 代码规范

### 前端页面

- 所有页面使用 `Component()` 模式（非 `Page()`）
- 引用 `page_init.js` 处理页面参数
- WXSS 禁止标签选择器、ID 选择器、`page{}` 选择器
- 使用 class 选择器或添加 `"styleIsolation": "apply-shared"`

### 后端模块

- 每个模块由 `index.js`（路由表）+ `xxx.js`（业务逻辑）组成
- 函数签名统一为 `async function funcName(identity, params)`
  - `identity`：admin 对象或 work 对象
  - `params`：前端传入的参数
- 使用 `validate()` 做参数校验
- 返回值统一使用 `success(data)` 或 `fail(CODE, msg)`

## 新增页面

1. 在 `frontcode/pages/` 下创建目录和 4 个文件：`.js` `.wxml` `.wxss` `.json`
2. 在 `app.json` 的 `pages` 数组中注册路径
3. JSON 中配置 `usingComponents` 引用所需组件
4. JS 使用 `Component({...})` 模式
5. 引入 `page_init.js`：`const pageInit = require('../../utils/page_init.js')`
6. 在 `onLoad` 中调用 `pageInit.initPageOptions(this, options)`

## 新增接口

1. 在对应后端模块的 `xxx.js` 中编写业务函数
2. 在模块 `index.js` 的路由表中注册：`'module/route_name': [handlerFunc]`
3. 前端 `services/` 中封装调用：
   ```js
   const cloud = require('../../utils/cloud.js');
   const result = await cloud.callCloudData('module/route_name', params, opts);
   ```

## 部署

### 云函数

1. 微信开发者工具中右键 `backcode/main`
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成（约 30 秒）

### 小程序

1. 开发者工具顶部「上传」按钮
2. 填写版本号和备注
3. 在微信公众平台「版本管理」中提审发布

## 调试技巧

- 云函数日志：云开发控制台 → 云函数 → 日志
- 数据库浏览：云开发控制台 → 数据库
- 本地调试：开发者工具「云函数」右键 → 本地调试
- 真机调试：工具栏「真机调试」可查看真机网络请求

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `validate.check()` 返回新对象 | 校验后字段在新对象上 | 用 `this.data.xxx` 获取不在校验规则中的字段 |
| `0` 被当作 falsy | JS `!0` 为 true | 统一用 `!= null` 判断 |
| WXSS 标签选择器无效 | WeChat 3.16.0+ 禁止 | 改用 class 选择器 |
| 输入框每次按键失焦 | `bindinput` 触发 setData 重渲染 | 用 `bindblur` 代替 |
| 教练登录返回按钮无效 | tabBar 页不支持 navigateTo | 用 `data-type="switch"` → `wx.switchTab` |
| 时间显示为原始数字 | `ADD_TIME` 是 epoch 秒 | 后端用 `timestamp2Time()` 格式化后再返回 |
