# TASK-014：矿池目录与挖矿手册

- 将合作矿池目录移入 Mining options，放在自托管 DATUM 选项后。
- 合作矿池只显示网站和简要说明，不显示 Stratum 地址；Competitiously 标题不含“community”，说明其首个社区矿池身份及 SOLO/PPLNS 模式；Mole 标注为目前最大的矿池；ArgfaMining 标注为首个 PROP 矿池，同时提供 SOLO 挖矿；移除 Crypto-Éire，最后新增 Rabid Mining，链接到 `https://pool.rabidmining.com/btc1#pool`，说明由 YouTuber 运营并支持 PPLNS/SOLO。
- 在 Mining options 的介绍段落后添加完整挖矿手册链接。简体中文页面使用 `zh.pdf`，正体中文页面使用 `zh-Hant.pdf`，英文页面使用 `en.pdf`。
- 更新英文、简体中文和正体中文文案；不新增 API、站内路由或葡萄牙语页面。
- 状态：本次矿池目录更新完成；8 项多语言测试、类型检查、变更文件 lint 和差异检查通过；未运行静态导出构建，未部署。
