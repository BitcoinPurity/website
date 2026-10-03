# 路由契约

无新增 API。英文页面维持原 URL。中文页面为 `/zh-CN/<page>/` 和 `/zh-TW/<page>/`，首页为对应前缀根路径。页面集合来自 `src/content/nav.ts` 的 routes；不支持的语言或页面返回 404。

静态资产、下载地址、外部服务与协议端点维持原值。所有语言页面的 canonical 指向自身，hreflang 覆盖 `en`、`zh-CN`、`zh-TW`，`x-default` 指向英文。
