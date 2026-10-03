# 路由契约

无新增 API。英文页面维持原 URL。中文页面为 `/zh-CN/<page>/` 和 `/zh-TW/<page>/`，首页为对应前缀根路径。页面集合来自 `src/content/nav.ts` 的 routes；不支持的语言或页面返回 404。

静态资产、下载地址、外部服务与协议端点维持原值。所有语言页面的 canonical 指向自身，hreflang 覆盖 `en`、`zh-CN`、`zh-TW`，`x-default` 指向英文。

Bitcoin Purity 最新正式版本下载地址为 `https://github.com/saltduck/bitcoinpurity/releases/tag/v1.0.0`，对应源码为 `https://github.com/saltduck/bitcoinpurity/tree/v1.0.0`。源码构建命令检出 `v1.0.0`；其他外部地址不变，无新增 API 或路由。
