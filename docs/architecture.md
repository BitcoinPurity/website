# 网站架构

- Next.js App Router，`output: export`，构建生成静态 HTML。
- `(english)` 路由组保留英文页面；`[locale]/[[...slug]]` 生成简体与正体中文页面，限制为已支持的语言与页面。
- 共用 SiteLayout 和页面视图，语言通过显式 props 传递；翻译词典与路径工具集中在 `src/lib/i18n.ts`。英文文案为词典键，动态值使用编号占位符。
- 服务地址、版本、命令与协议参数仍来自现有内容模块。语言仅影响文案和站内路径。
- 当前 Bitcoin Purity 版本由 `src/content/protocol.ts` 统一维护：`release: 1.0.0`、`releaseTag: v1.0.0`、`isReleaseCandidate: false`。版本状态由公共组件和页面通过翻译词典显示。
- 多语言元数据与 sitemap 共用路径规则。构建后的 CSS/复制脚本处理为所有语言生成 Worker 使用的平铺 HTML 别名。
