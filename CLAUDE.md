# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WeChat Mini Program (微信小程序) for gym/fitness private coaching appointments, built on **WeChat Cloud Development** (腾讯云开发) using the **CCMiniCloud Framework**. It provides three user roles:
- **User side** (用户端): Browse coaches, book appointments, scan QR codes for check-in
- **Coach side** (教练端/Work): Manage personal profile, set availability, verify user check-ins
- **Admin side** (后台管理): Manage coaches, users, appointments, announcements, and export data

Default admin credentials: `admin` / `123456`

## Build & Run

This project uses the **WeChat Developer Tools** (微信开发者工具) IDE — there are no CLI build/test commands.

- `project.config.json` defines the miniprogram root as `miniprogram/` and cloudfunction root as `cloudfunctions/`; `project.private.config.json` holds local overrides
- The entire backend runs through a single cloud function named `mcloud` deployed from `cloudfunctions/mcloud/`
- Use WeChat Developer Tools to preview, compile, and upload

No package manager install is needed for the miniprogram side. Cloud functions have dependencies in `cloudfunctions/mcloud/package.json` (wx-server-sdk, mysql, node-xlsx, date-utils) and should be installed via `npm install` inside that directory before deployment.

## Project ID System

The framework supports multiple sub-projects (此功能为"多功能平台"). The project identifier `PID` flows through the entire call chain:
- `miniprogram/projects/workfit/` — the gym appointment project (PID = `workfit`)
- `cloudfunctions/mcloud/project/workfit/` — cloud-side project code
- URL routing with `fmtURLByPID()` converts generic paths to project-specific paths
- DB records are scoped with `_pid` field automatically via `MultiModel._getWhere()`

## Architecture

### Frontend (miniprogram/)

```
miniprogram/
├── app.js / app.json / app.wxss          # Entry point; cloud init, tabbar config
├── setting/setting.js                     # Frontend config (CLOUD_ID, cache, IS_DEMO)
├── cmpts/                                 # Reusable components
│   ├── public/ (form, list, picker, modal)
│   └── biz/ (business components)
├── comm/                                  # Shared code
│   ├── biz/                               # Shared business logic (passport, fav, search, etc.)
│   └── behavior/                          # Page behaviors (mixins pattern)
├── helper/                                # Utility helpers (page_helper, cache_helper, pic_helper)
├── lib/tools/                             # Third-party utilities
├── projects/workfit/                      # ★ Main project directory
│   ├── biz/                               # Project-specific business logic
│   │   ├── meet_biz.js                    #   User-side appointment logic
│   │   ├── work_biz.js                    #   Coach-side logic
│   │   ├── admin_meet_biz.js              #   Admin appointment management
│   │   └── project_biz.js                 #   Project-specific API calls
│   └── pages/                             # Pages — each sub-dir is a page module
│       ├── default/index/                 # Home
│       ├── meet/ (calendar, detail, join) # User appointment pages
│       ├── work/index/ (home, login)      # Coach login & dashboard
│       ├── work/meet/ (scan, join, time)  # Coach appointment management
│       ├── admin/ (login, news, meet, mgr, user, setup) # Admin backend
│       ├── my/ (index, edit, fav, foot)   # User profile
│       └── news/ (index, detail, cate*)   # Announcements
└── style/                                 # Base, project, and public WXSS
```

### Backend (cloudfunctions/mcloud/)

```
cloudfunctions/mcloud/
├── index.js                               # Cloud function entry — delegates to application.app()
├── config/config.js                       # Backend config (CLOUD_ID, DB prefix, IS_DEMO)
├── framework/                             # CCMiniCloud Framework (reusable across projects)
│   ├── core/                              # App framework core
│   │   ├── application.js                 # Main router: parses route → instantiates controller → calls action
│   │   ├── app_code.js                    # HTTP-like error codes (200, 500, 1600, etc.)
│   │   ├── app_error.js                   # Custom AppError class
│   │   └── app_util.js                    # Response formatter (handlerSucc, handlerData, handlerSvrErr)
│   ├── cloud/                             # WeChat Cloud SDK wrappers (wx-server-sdk)
│   ├── database/                          # ORM layer
│   │   ├── model.js                       # Base Model — CRUD, pagination, data validation, schema conversion
│   │   └── multi_model.js                 # MultiModel — extends Model with _pid scoping
│   ├── platform/                          # Base classes for projects
│   │   ├── controller/base_controller.js  # Parses openId, token, validates input
│   │   ├── controller/base_admin_controller.js # Adds admin auth + logging
│   │   ├── model/base_model.js            # Extends MultiModel
│   │   └── service/                       # Base service classes
│   ├── lib/                               # faker_lib, md5_lib, mini_lib
│   └── utils/                             # time_util, data_util, export_util, etc.
└── project/workfit/                       # ★ Project-specific cloud code
    ├── public/route.js                    # Route table: maps 'controller/action' strings to controller@method
    ├── controller/                        # Request handlers
    │   ├── base_project_controller.js     #   Sets up project-level services
    │   ├── meet_controller.js             #   User appointment APIs
    │   ├── passport_controller.js         #   Login/registration
    │   ├── home_controller.js             #   Home page data
    │   ├── news_controller.js             #   Announcements
    │   ├── fav_controller.js              #   Favorites
    │   ├── work/                          #   Coach-side controllers
    │   └── admin/                         #   Admin-side controllers
    ├── model/                             # Database schema definitions (ORM models)
    │   └── Each model defines: CL (collection name), DB_STRUCTURE (field schema), FIELD_PREFIX
    └── service/                           # Business logic layer
```

### Request Flow

1. Mini program calls cloud function via `wx.cloud.callFunction({ name: 'mcloud', data: { route, PID, params, token } })`
2. `application.js` receives the event, parses `route` (e.g., `meet/list`), extracts `PID`, and resolves the controller
3. Looks up the route in `project/{PID}/public/route.js` to map to `controller@action`
4. Instantiates the controller (passing `route`, a composite key `PID^^^openId`, and the raw event), calls `initSetup()`, then calls the action method
5. Controller validates input via `validateData()`, delegates to a service, which uses models for DB operations
6. Response is wrapped by `appUtil.handlerData()` and returned with standard format: `{ code: 200, data: ... }`
7. Error codes: `200` (success), `500` (server error), `1600` (logic error), `1301` (data validation), `2401` (admin auth), `2501` (coach auth)

### Route definition pattern

In `route.js`: `'meet/list': 'meet_controller@getMeetList'`
- Routes that end with `#demo` (e.g., `'admin/mgr_insert': 'admin_mgr_controller@insertMgr#demo'`) are write-blocked when `IS_DEMO: true` in config

### Model conventions

Each DB model defines:
- `CL` — collection name (prefixed with `COLLECTION_PRFIX` from config, default `bx_`)
- `DB_STRUCTURE` — field definitions: `fieldName: 'type|required|default=X|comment=描述'`
- `FIELD_PREFIX` — e.g., `MEET_` — all fields are prefixed
- All CRUD goes through the static model methods inherited from `Model` → `MultiModel` → `BaseModel`
- `MultiModel` automatically adds `_pid` filter to all queries for multi-project isolation

### Frontend conventions

- Page files use the pattern: `{module}_{page}.js` (e.g., `meet_calendar.js`)
- Global components are registered in `app.json` under `usingComponents`
- `page_helper.js` is the central utility for navigation, toast messages, form binding, list manipulation, caching
- `base_biz.js` provides shared business logic for category handling
- Business logic (API calls) lives in `biz/` directories, not directly in pages

## Demo mode

Both frontend (`setting.js`) and backend (`config.js`) have `IS_DEMO: false`. When enabled, all write operations (routes with `#demo` suffix) return an error saying the operation is disabled in demo mode.

## Database

Uses WeChat Cloud Database (a NoSQL document database similar to MongoDB). Collections are named with the `bx_` prefix (`COLLECTION_PRFIX` in `config/config.js`). The framework provides a full ORM over `wx-server-sdk`'s database API including pagination, aggregation, batch operations, and schema validation.

- Config is split: `miniprogram/setting/setting.js` (frontend), `cloudfunctions/mcloud/config/config.js` (backend)
- `miniprogram/comm/constants.js` holds shared frontend constants (CACHE, ROUTE, page size, etc.)
- All frontend cloud calls go through `projects/workfit/biz/project_biz.js`, which wraps `wx.cloud.callFunction` with PID injection and route-based dispatch
