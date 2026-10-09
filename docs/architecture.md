# 网站架构

- Next.js App Router，`output: export`，构建生成静态 HTML。
- `(english)` 路由组保留英文页面；`[locale]/[[...slug]]` 生成简体与正体中文页面，限制为已支持的语言与页面。
- 共用 SiteLayout 和页面视图，语言通过显式 props 传递；翻译词典与路径工具集中在 `src/lib/i18n.ts`。英文文案为词典键，动态值使用编号占位符。
- 服务地址、版本、命令与协议参数仍来自现有内容模块。语言仅影响文案和站内路径。
- Contact 的 Discord 与 BBS 地址由 `src/content/links.ts` 的 `CONTACT` 统一提供，首页和页脚复用 `ExternalLink` 展示。
- 当前 Bitcoin Purity 版本由 `src/content/protocol.ts` 统一维护：`release: 1.0.1`、`releaseTag: v1.0.1`、`isReleaseCandidate: false`、`p2pUserAgent: /Satoshi:29.4/Purity:1.0.1/`。版本状态由公共组件和页面通过翻译词典显示。
- 多语言元数据与 sitemap 共用路径规则。构建后的 CSS/复制脚本处理为所有语言生成 Worker 使用的平铺 HTML 别名。

## BBS

### 定时局部刷新

`bbs/src/live-config.ts` 统一定义默认 180 秒、失败退避 360/720/900 秒及 20 秒超时。仅公开浏览页加载静态模块 `bbs/public/live-refresh.js`；隐藏暂停、恢复检查、请求去重和取消由轮询器管理。首次页面加载只启动计时，不立即重复请求。

`GET /api/live` 在初始化检查后使用一次 D1 batch 同时查询会话、可见页面数据和全部作者资料。常规渲染与批量刷新共用帖子/主贴历史、作者、统计 SQL 和 HTML 模板，不增加 schema、版本表或触发器。读取快照不会写已读或初始化 CSRF。新会话创建时提供 CSRF，旧会话只在首次 thread HTML 请求缺失时补建。

快照包含 navigation/content 两个 HTML 区域的 SHA-256 摘要、标题、账号 ID、主题锁定状态、帖子父子关系及快照最大帖子 ID。区域变化时客户端按稳定分类、版块、主题及帖子 ID 递归协调子节点；相同节点不修改。回复输入框外壳标记为保留节点，服务器因锁帖省略表单时也保留现有草稿并禁用提交。整体 SHA-256 为 ETag，304 仍执行读取 batch；不包含 CSRF 或缓存其他账号内容。

展示成功后通过独立 POST 确认进度，一次 batch 校验会话/CSRF、可见性和帖子归属，并条件 upsert。失败确认可重试，相同或旧进度不触发实际更新；新回复在快照之后抵达时仍为未读。局部更新前保存阅读锚点，更新后恢复偏移，不自动跳转底部。身份变化停止并禁用操作，可见性丢失隐藏原内容。

主贴编辑使用 `/thread/:id/edit` 的 GET/POST，在服务端以首帖的 `user_id` 校验当前登录账号，不按用户名或管理员角色授予权限。复用会话的 CSRF token，编辑页面及保存响应禁止缓存。`post_edits(id, post_id, edited_at)` 仅存每次实际修改的服务器时间，按 id 顺序显示；索引 `(post_id, id)` 配合 `getPosts()` 的 JSON 聚合查询取得记录；CTE 找到主贴 ID，只有未删除主贴读取一次修改记录，回复直接返回空记录，不增加普通帖子页数据库往返。

保存使用一个 D1 batch：在同一事务中校验首帖账号、封禁、删除及归档状态，并仅在标题或正文变化时插入时间记录，后续正文和标题更新由该插入的结果授权。回复、原发帖时间、统计、积分、徽章及阅读进度保持不变。数据库版本升级为 `schema_2026_10_09`，新库 SQL 与运行时自动升级均创建记录表和索引，无旧时间回填。

请求中间件调用 `initializeDatabase()`，先从 `bbs_migrations` 读取当前数据库版本的完成标记。只有新库或缺少标记的旧库才执行原有 `ensureSchema()` 和 `seedBoardsIfEmpty()`，成功后保存标记；其他数据库错误直接向上抛出。标记存于 D1，新的 Worker 实例和绑定对象同样可以走快速路径，无进程缓存依赖。今后修改 schema、默认版块或回填逻辑时须更新 `DATABASE_VERSION`。

帖子作者列表作为单个 JSON 参数传给 SQLite `json_each()`，避免多作者超出绑定参数数量限制。资料及公开活动计数、历史徽章使用两条 SELECT 组成一次 D1 batch；按账号 ID 关联徽章，再按规范化用户名提供给现有模板。完成初始化的游客帖子请求为 5 次数据库往返；有效登录会话与阅读进度更新额外各一次。

Hono 内置 `timing()` 和 `wrapTime()` 在响应头输出请求自身的阶段指标，不增加数据库查询。所有动态响应包含 `init` 与 `total`，帖子页按执行路径增加 `session`、`thread`、`board`、`posts`、`authors`、`read`。无跨域计时授权或数据内容输出；静态图标仍直接由资产服务返回。Workers 的时钟随 I/O 推进，此指标适合定位数据库等待，不包含 Worker 外部网络、调度或精确 CPU 耗时。

`bbs/wrangler.jsonc` 设置 `placement.mode: smart`，Cloudflare 按观测到的请求耗时及转发成本决定是否将 fetch 处理移到更合适的位置。目的是减少远端 Worker 到 D1 的多次往返；不硬编码尚未确认的数据库位置。资产服务仍就近返回静态图标。首次分析可能需要约 15 分钟及来自多个位置的持续请求，线上效果需结合阶段计时和平台 placement 状态验证。

`getBoardIndex()` 使用一个 D1 batch：第一条 SELECT 按排序读取正常分类及版块层级，第二条 SELECT 一次性按版块聚合正常分类下的正常版块统计。内存中按 ID 将统计归入有序分类，保留空分类及原有统计字段；不再逐个分类/版块访问 D1。共用统计 SELECT 仍用于分类详情页，过滤与未读计数语义一致。主页单独计时 `session`、`index`，完成初始化后的游客/登录请求分别为 2/3 次数据库往返。

`getCategory()` 同样使用一个 D1 batch：第一条 SELECT 按 ID 或 slug 读取正常根分类，第二条使用分类子查询限定正常子版块并批量聚合统计，按 sort_order/id 排序。不再逐版块查询；缺失、归档或非根分类返回空结果，由路由保持 404。分类页计时 `session`、`category`，完成初始化后的游客/登录请求为 2/3 次数据库往返。

`boards.slug` 保存分类与可发帖版块的公开地址标识，唯一索引防止重名。运行时幂等添加字段并为缺少 slug 的分类及版块按 ID 顺序回填，保留已有版块 slug；初始化和后台新增分类与版块调用同一逻辑。slug 由名称 Unicode 规范化、转小写并以连字符连接生成，重名追加数字后缀，纯数字名称加 `board-` 前缀。现有 slug 在改名及移动后保持稳定，Unicode 地址输出时编码。分类及版块公开路由按 slug 查找，旧数字 GET 地址 301 跳转；数字 POST 直接处理。主题地址、数据库关联和后台管理继续使用 ID。

BBS 公共 HTML 模板统一声明独立标签页图标，引用同源 `/favicon.svg`、`/favicon.ico`、`/favicon-16.png` 和 `/favicon-32.png`。矢量源与兼容格式位于 `bbs/public/`，由 Wrangler 的 `assets.directory` 提供；命中图标的请求直接返回静态资产，不进入论坛数据库初始化。SVG 不依赖字体或外部资源，PNG 和 ICO 由同一矢量源生成。主站品牌资产保持原样。

BBS 位于 `bbs/`，采用 Hono、Cloudflare Worker 和 D1。版块以 `boards.parent_id` 区分分类与可发帖子版块。`Announcement` 属于 Bitcoin Purity 分类，`sort_order` 为 0；SQL 种子与运行时初始化按分类名称查找父级，幂等添加该版块，支持已迁移的分类 ID。

`thread_reads` 以 `(user_id, thread_id)` 为主键保存 `last_read_post_id`。主题展示后仅记录本次响应中帖子 ID 的最大值，更新时取较大进度，避免同秒新回复漏计和并发旧响应覆盖新阅读进度。首页、分类页和版块页按当前账号统计存在更大帖子 ID 的主题数；统计与列表分页无关。SQL 建表和运行时初始化同步添加该表。

公共计数徽标在数量为 0 时不输出 HTML，首页、分类页和版块页使用一致的隐藏规则。

## BBS 管理后台

后台运行于现有 Hono Worker，复用 D1 用户和会话。用户新增 role/is_banned，主题新增 is_deleted/is_locked/is_pinned，回复新增 is_deleted，版块新增 is_archived，会话新增 csrf_token。bbs_migrations 记录版块升级完成状态，避免运行时补建覆盖后台调整。所有新增状态默认正常，账号默认 user。

后台 GET 提供服务端 HTML，POST 执行审核与管理并 303 跳转。每次请求检查当前账号状态，后台禁止缓存；POST 校验会话 token 和同源 Origin。多项关联变更使用 D1 batch，用户权限写入包含最后管理员保护条件。

公开查询过滤删除主题及归档分类/版块，删除回复只返回占位正文，保留回复树。主题统计按未删除帖子更新；未读计数和个人资料公开帖子/主题数量排除删除及归档内容。积分回填和徽章授予使用历史活动，历史积分、徽章和阅读进度不回退。发帖、回复和创建登录会话在写入时再次检查审核或封禁状态；发帖内容、积分及主题统计原子更新。
