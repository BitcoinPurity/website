# 网站架构

- Next.js App Router，`output: export`，构建生成静态 HTML。
- `(english)` 路由组保留英文页面；`[locale]/[[...slug]]` 生成简体与正体中文页面，限制为已支持的语言与页面。
- 共用 SiteLayout 和页面视图，语言通过显式 props 传递；翻译词典与路径工具集中在 `src/lib/i18n.ts`。英文文案为词典键，动态值使用编号占位符。
- 服务地址、版本、命令与协议参数仍来自现有内容模块。语言仅影响文案和站内路径。
- 当前 Bitcoin Purity 版本由 `src/content/protocol.ts` 统一维护：`release: 1.0.0`、`releaseTag: v1.0.0`、`isReleaseCandidate: false`。版本状态由公共组件和页面通过翻译词典显示。
- 多语言元数据与 sitemap 共用路径规则。构建后的 CSS/复制脚本处理为所有语言生成 Worker 使用的平铺 HTML 别名。

## BBS

BBS 公共 HTML 模板统一声明标签页图标，直接引用 `https://bitcoinpurity.org/favicon.ico`、`favicon-16.png` 和 `favicon-32.png`，复用官网品牌资产。

BBS 位于 `bbs/`，采用 Hono、Cloudflare Worker 和 D1。版块以 `boards.parent_id` 区分分类与可发帖子版块。`Announcement` 属于 Bitcoin Purity 分类，`sort_order` 为 0；SQL 种子与运行时初始化按分类名称查找父级，幂等添加该版块，支持已迁移的分类 ID。

`thread_reads` 以 `(user_id, thread_id)` 为主键保存 `last_read_post_id`。主题展示后仅记录本次响应中帖子 ID 的最大值，更新时取较大进度，避免同秒新回复漏计和并发旧响应覆盖新阅读进度。首页、分类页和版块页按当前账号统计存在更大帖子 ID 的主题数；统计与列表分页无关。SQL 建表和运行时初始化同步添加该表。

公共计数徽标在数量为 0 时不输出 HTML，首页、分类页和版块页使用一致的隐藏规则。
