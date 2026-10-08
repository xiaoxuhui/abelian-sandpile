# 参与贡献

先阅读 doc/ 下的需求、设计和实施计划。项目遵守与 EML 相同的规划驱动开发纪律。

1. 先定义需求与 Uxx/Ixx 验收，再实现规则或交互；产品规则变更应写明数据兼容性影响。
2. 每个逻辑单元独立 commit，前缀使用 feat / fix / refactor / docs / test / release。
3. 提交前实际运行 `node scripts/check.mjs`、`node --test`、`node scripts/build.mjs`；正式关卡执行 sync-levels --check 与 verify-levels；页面变化补真实浏览器桌面/移动交互证据。
4. 关卡参考解只能证明可达；标注最少步数须用可重复穷举工具证明。禁止为过测弱化断言。
5. 计划只用 PENDING / COMPLETE / VERIFIED；验证记录应包含命令、结果数字、浏览器操作和未验证项。
6. 所有运行资源保持离线及相对路径，存储只访问本游戏前缀；不要修改其它游戏仓库或大厅来源锁。
7. 不提交保密密钥、生产签名、node_modules、临时数据或生成 APK；仅android/app/debug.keystore作为技能要求的公开固定开发签名允许入库。测试前运行node scripts/build.mjs及node scripts/sync-android-assets.mjs。当前已获此单游戏v0.1.2 APK／标签／Release授权，后续发行仍按对应授权执行。

项目已有公开源码与可玩的 v0.1.2 本地网页，Android首包以预发行提供；可提交普通问题或改进建议。
