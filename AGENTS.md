# AGENTS.md

## Project Type
WeChat Mini Program (健身房私教预约系统) - CloudBase + wx-server-sdk

## Quick Start
1. Open in WeChat Developer Tools
2. Root: `/home/bjzm/weixin/code`
3. Frontend: `frontcode/` (miniprogramRoot)
4. Backend: `backcode/` (cloudfunctionRoot)
5. Deploy cloud function: `cd backcode/main && npm install`

## Architecture

### Frontend (frontcode/)
- All pages use `Component()` (not Page)
- Cloud calls: `utils/cloud.js` → `callCloudData`, `callCloudSubmit`, `dataList`
- Token auto-select by route prefix: `admin/` → admin token, `work/` → work token, else user token
- Universal list: `cmpt-comm-list` (pagination, search, filter, sort)
- Form system: `cmpt-form-show` + `cmpt-form-set` + `cmpt-editor`

### Backend (backcode/main/)
- Single cloud function `main` with route dispatch by prefix
- Auth: `common/auth.js` → `checkAdmin`, `checkWork`, `checkUser`
- DB: `common/db.js` wraps wx-server-sdk with auto timestamp/IP
- Response: `{ code: 200, data }` / `{ code: 1600, msg }` / `{ code: 2401 }` (admin fail) / `{ code: 2501 }` (work fail)
- Collection prefix: `bx_`

## Critical Pitfalls

1. **`validate.check()` returns new object** — use `this.data.xxx` for fields not in validation rules after calling it
2. **0 is falsy** — never use `||` for values that can be 0; use `!= null` instead
3. **Component WXSS** — WeChat 3.16.0 bans tag/ID selectors and `page{}`. Use class selectors or add `"styleIsolation": "apply-shared"` to page JSON
4. **Component lifecycle** — property observers fire during `created` when `setData` may not be available; sync in `attached()` if needed
5. **`getSelectOptions`** returns `{val, label}` objects — picker reads `.val`, not `.value`
6. **Work coach = Meet** — coach login uses `MEET_PHONE` + password, `work._id` IS the meet ID (one-to-one)

## Default Credentials
- Admin: `admin` / `123456`

## Tech Stack
- wx-server-sdk (latest)
- bcryptjs
- node-xlsx
- WeChat CloudBase

## File Structure
```
frontcode/services/    # Business modules (auth, admin, work, meet, news, user, common)
frontcode/utils/       # Utilities (cloud, router, validate, cache, time, data, helper, toast, form, list, dom, pic, page_init, constants)
backcode/admin/        # 25 admin endpoints
backcode/work/         # 15 coach endpoints
backcode/meet/         # User booking endpoints
backcode/common/       # Shared (auth, db, response, util, validate)
```
