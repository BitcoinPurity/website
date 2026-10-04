# 网站架构

- Next.js App Router，`output: export`，构建生成静态 HTML。
- `(english)` 路由组保留英文页面；`[locale]/[[...slug]]` 生成简体与正体中文页面，限制为已支持的语言与页面。
- 共用 SiteLayout 和页面视图，语言通过显式 props 传递；翻译词典与路径工具集中在 `src/lib/i18n.ts`。英文文案为词典键，动态值使用编号占位符。
- 服务地址、版本、命令与协议参数仍来自现有内容模块。语言仅影响文案和站内路径。
- 当前 Bitcoin Purity 版本由 `src/content/protocol.ts` 统一维护：`release: 1.0.0`、`releaseTag: v1.0.0`、`isReleaseCandidate: false`。版本状态由公共组件和页面通过翻译词典显示。
- 多语言元数据与 sitemap 共用路径规则。构建后的 CSS/复制脚本处理为所有语言生成 Worker 使用的平铺 HTML 别名。

## BBS

`boards.slug` 保存分类与可发帖版块的公开地址标识，唯一索引防止重名。运行时幂等添加字段并为缺少 slug 的分类及版块按 ID 顺序回填，保留已有版块 slug；初始化和后台新增分类与版块调用同一逻辑。slug 由名称 Unicode 规范化、转小写并以连字符连接生成，重名追加数字后缀，纯数字名称加 `board-` 前缀。现有 slug 在改名及移动后保持稳定，Unicode 地址输出时编码。分类及版块公开路由按 slug 查找，旧数字 GET 地址 301 跳转；数字 POST 直接处理。主题地址、数据库关联和后台管理继续使用 ID。

BBS 公共 HTML 模板统一声明独立标签页图标，引用同源 `/favicon.svg`、`/favicon.ico`、`/favicon-16.png` 和 `/favicon-32.png`。矢量源与兼容格式位于 `bbs/public/`，由 Wrangler 的 `assets.directory` 提供；命中图标的请求直接返回静态资产，不进入论坛数据库初始化。SVG 不依赖字体或外部资源，PNG 和 ICO 由同一矢量源生成。主站品牌资产保持原样。

BBS 位于 `bbs/`，采用 Hono、Cloudflare Worker 和 D1。版块以 `boards.parent_id` 区分分类与可发帖子版块。`Announcement` 属于 Bitcoin Purity 分类，`sort_order` 为 0；SQL 种子与运行时初始化按分类名称查找父级，幂等添加该版块，支持已迁移的分类 ID。

`thread_reads` 以 `(user_id, thread_id)` 为主键保存 `last_read_post_id`。主题展示后仅记录本次响应中帖子 ID 的最大值，更新时取较大进度，避免同秒新回复漏计和并发旧响应覆盖新阅读进度。首页、分类页和版块页按当前账号统计存在更大帖子 ID 的主题数；统计与列表分页无关。SQL 建表和运行时初始化同步添加该表。

公共计数徽标在数量为 0 时不输出 HTML，首页、分类页和版块页使用一致的隐藏规则。

## BBS 管理后台

后台运行于现有 Hono Worker，复用 D1 用户和会话。用户新增 role/is_banned，主题新增 is_deleted/is_locked/is_pinned，回复新增 is_deleted，版块新增 is_archived，会话新增 csrf_token。bbs_migrations 记录版块升级完成状态，避免运行时补建覆盖后台调整。所有新增状态默认正常，账号默认 user。

后台 GET 提供服务端 HTML，POST 执行审核与管理并 303 跳转。每次请求检查当前账号状态，后台禁止缓存；POST 校验会话 token 和同源 Origin。多项关联变更使用 D1 batch，用户权限写入包含最后管理员保护条件。

公开查询过滤删除主题及归档分类/版块，删除回复只返回占位正文，保留回复树。主题统计按未删除帖子更新；未读计数和个人资料公开帖子/主题数量排除删除及归档内容。积分回填和徽章授予使用历史活动，历史积分、徽章和阅读进度不回退。发帖、回复和创建登录会话在写入时再次检查审核或封禁状态；发帖内容、积分及主题统计原子更新。
