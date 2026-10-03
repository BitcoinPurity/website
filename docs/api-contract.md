# 路由契约

BBS 标签页图标通过公共模板的 `rel="icon"` 链接加载官网现有图标，无新增 BBS 路由或静态资产绑定。

无新增 API。英文页面维持原 URL。中文页面为 `/zh-CN/<page>/` 和 `/zh-TW/<page>/`，首页为对应前缀根路径。页面集合来自 `src/content/nav.ts` 的 routes；不支持的语言或页面返回 404。

静态资产、下载地址、外部服务与协议端点维持原值。所有语言页面的 canonical 指向自身，hreflang 覆盖 `en`、`zh-CN`、`zh-TW`，`x-default` 指向英文。

Bitcoin Purity 最新正式版本下载地址为 `https://github.com/saltduck/bitcoinpurity/releases/tag/v1.0.0`，对应源码为 `https://github.com/saltduck/bitcoinpurity/tree/v1.0.0`。源码构建命令检出 `v1.0.0`；其他外部地址不变，无新增 API 或路由。

BBS 的 Announcement 复用现有 `/board/:id`、`/board/:id/new` 与帖子回复路由；版块 ID 由数据库分配，入口从首页与 Bitcoin Purity 分类页生成。发帖仍遵循已有登录和限流规则，无新增 API。

BBS 的 `GET /`、`GET /category/:id`、`GET /board/:id` 显示当前登录账号的各版未读主题数量，浏览列表不写入阅读记录。成功打开 `GET /thread/:id` 后，以本次展示过的帖子 ID 更新该账号的主题阅读进度；未登录请求不保存。上述页面使用 `Cache-Control: private, no-store`，防止缓存复用过期或其他账号的计数。无新增公开 API。

数量为 0 时页面不显示未读徽标；数据库计数和路由行为不变。
