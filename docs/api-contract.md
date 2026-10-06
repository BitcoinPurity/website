# 路由契约

Contact 的 Discord server 指向 `https://discord.gg/yjyz9JcZT`，BBS 指向 `https://bbs.bitcoinpurity.org/`；各语言使用同一外部地址，无新增 API 或站内路由。

BBS 公共模板通过 `rel="icon"` 加载同源独立图标。`GET /favicon.svg` 返回 `image/svg+xml`，`GET /favicon.ico` 返回 `image/vnd.microsoft.icon`，`GET /favicon-16.png` 与 `GET /favicon-32.png` 返回 `image/png`，由 Worker 静态资产提供，不要求登录或访问数据库。未命中静态资产的页面请求仍由原有 Hono 路由处理。

无新增 API。英文页面维持原 URL。中文页面为 `/zh-CN/<page>/` 和 `/zh-TW/<page>/`，首页为对应前缀根路径。页面集合来自 `src/content/nav.ts` 的 routes；不支持的语言或页面返回 404。

静态资产、下载地址、外部服务与协议端点维持原值。所有语言页面的 canonical 指向自身，hreflang 覆盖 `en`、`zh-CN`、`zh-TW`，`x-default` 指向英文。

Bitcoin Purity 最新正式版本下载地址为 `https://github.com/saltduck/bitcoinpurity/releases/tag/v1.0.1`，对应源码为 `https://github.com/saltduck/bitcoinpurity/tree/v1.0.1`。源码构建命令检出 `v1.0.1`；其他外部地址不变，无新增 API 或路由。

BBS 的 Announcement 复用现有 `/board/:slug`、`/board/:slug/new` 与帖子回复路由；版块 slug 持久保存，入口从首页与 Bitcoin Purity 分类页生成。发帖仍遵循已有登录和限流规则，无新增 API。

BBS 的 `GET /`、`GET /category/:slug`、`GET /board/:slug` 显示当前登录账号的各版未读主题数量，浏览列表不写入阅读记录。成功打开 `GET /thread/:id` 后，以本次展示过的帖子 ID 更新该账号的主题阅读进度；未登录请求不保存。上述页面使用 `Cache-Control: private, no-store`，防止缓存复用过期或其他账号的计数。无新增公开 API。

数量为 0 时页面不显示未读徽标；数据库计数和路由行为不变。

## BBS 管理路由

- `GET /admin`：数量统计。
- `GET /admin/threads`：`q` 标题搜索、`board_id`、`status=active|deleted|all`、`page`，每页 50 条；`GET /admin/threads/:id` 查看审核详情，回复分页。
- `GET /admin/users`：`q` 用户名搜索、`page`；`GET /admin/boards`：分类/版块编辑与分页。
- `POST /admin/threads/:id/:action`：delete、restore、lock、unlock、pin、unpin、move；move 使用 `board_id`。
- `POST /admin/posts/:id/:action`：delete、restore；首帖操作映射为主题操作。
- `POST /admin/users/:id/:action`：ban、unban、grant-admin、revoke-admin。
- `POST /admin/boards`：新增，字段 name、description、sort_order、parent_id（空为分类）。`POST /admin/boards/:id/update` 使用同样字段，类别不可转换；`POST /admin/boards/:id/archive|restore` 更新归档状态。

所有后台 POST 必须携带 `csrf_token`，且 Origin 存在时必须与请求 URL 同源。成功返回 303。未登录跳转 `/login?next=...`，无权限/CSRF 错误返回 403，非法输入返回 400，目标不存在返回 404，状态冲突返回 409。后台均使用 `Cache-Control: private, no-store`。

公开个人资料的帖子/主题数量仅包含未删除且位于正常分类及版块下的内容，历史积分与徽章保留。对已删除回复的直接回复请求返回 400；深层回复调整父级时跳过已删除祖先。发帖/回复校验后目标被锁定、删除或归档时，写入拒绝并返回 409，不产生内容、奖励或统计变更。登录校验后账号被封禁时，不创建会话并返回 401。

## BBS 分类与版块 slug 路由

- `GET /category/:slug`：分类下的版块列表；旧数字 `GET /category/:id` 返回 301，跳转至 slug 地址并保留查询参数。分类页使用 `private, no-store`。
- `GET /board/:slug`：版块主题列表；分类的旧 `/board/:id` 入口跳转 `/category/:slug` 并保留查询参数。
- `GET /board/:slug/new`：发帖表单；访客 303 跳转登录，next 保留 slug 路径与查询参数。
- `POST /board/:slug/new`：沿用登录、限流和可发帖状态校验，成功 303 跳转主题。
- 旧数字 `GET /board/:id` 与 `GET /board/:id/new`：存在且正常的子版块 301 跳转到 slug 地址，保留查询参数；旧数字 POST 仍直接处理发帖。
- 不存在或归档的版块及所属分类返回 404；版块浏览和发帖 GET 响应使用 `private, no-store`。主题 URL、后台操作与数据库关联继续使用 ID。
