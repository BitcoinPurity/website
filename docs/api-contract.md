# 路由契约

## BBS 主贴编辑

- `GET /thread/:id/edit`：仅主贴作者获取预填标题、正文及会话 `csrf_token` 的编辑表单；取消返回 `/thread/:id#post-<首帖ID>`，不写阅读进度或修改记录。
- `POST /thread/:id/edit`：字段 `title`、`body`、`csrf_token`；忽略客户端提供的帖子 ID、父帖 ID 和修改时间，只更新该主题首帖。标题及正文去除首尾空白后必须非空且不超过 120/10000 字符；失败保留原始输入。
- 未登录 303 跳转 `/login?next=...`；非作者（含管理员）、CSRF 错误及跨源 Origin 返回 403；非法 ID 或内容返回 400；不存在、已删除主贴/主题或归档分类/版块返回 404；写入时权限或状态改变返回 409；成功及原样保存返回 303 至首帖锚点。编辑 GET/POST 均为 `private, no-store`。
- 锁帖仍可由作者编辑主贴。每次实际修改原子更新标题、正文并记录服务器 UTC 时间，原样保存不记录。`GET /thread/:id` 在主贴正文下方留出 24px 间隔展示全部修改时间；删除主贴不显示编辑入口或记录。回复没有编辑端点与入口，原有阅读与未读规则不变。帖子和主贴修改记录通过同一条 SQL 获取，修改记录只读取一次，回复不查询修改记录；浏览不写修改记录。

BBS 页面地址、参数及响应不变。数据库升级完成后的页面请求只读取当前版本的持久化完成标记，不再重复迁移。`GET /thread/:id` 批量获取作者公开资料与历史徽章，保持删除/归档内容过滤、`private, no-store` 和按实际展示快照更新阅读进度的行为。

BBS 动态响应新增 `Server-Timing`：`init;dur=<毫秒>,total;dur=<毫秒>;desc="Worker handler"`。成功帖子响应另含 `session`、`thread`、`board`、`posts`、`authors`，登录且展示帖子时含 `read`；错误路径只报告实际执行阶段。没有新增公开端点或查询，指标仅包含固定名称和毫秒耗时，不开放 `Timing-Allow-Origin`。计时覆盖 Worker 内部 I/O 等待，不包含外部网络与进入 Worker 前的等待。

Worker Smart Placement 仅改变平台选择的执行位置，现有路由、状态码、缓存头及账号规则不变；部署后保留上述计时指标用于同位置比较，不新增应用 API。

`GET /` 的分类、版块和统计批量获取，页面数据及排序保持不变；未读计数按当前账号隔离，保留 `private, no-store`，不写入阅读记录。主页 `Server-Timing` 增加 `session` 与 `index` 阶段，以区分登录检查和索引查询。

`GET /category/:slug` 批量获取分类及子版块统计，保留排序、空分类、审核过滤及账号未读计数；响应增加 `session` 与 `category` 计时。不存在、归档或非根分类返回 404；旧数字地址仍 301 跳转并保留查询参数，保留 `private, no-store`，不写入阅读记录。

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
