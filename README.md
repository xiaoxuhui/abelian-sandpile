# 阿贝尔沙滩

基于 **Abelian sandpile（阿贝尔沙堆）** 的离线数学小游戏，当前 **v0.1.1 本地网页版**已可游玩。公开源码：[xiaoxuhui/abelian-sandpile](https://github.com/xiaoxuhui/abelian-sandpile)，MIT 许可。当前尚未创建发行标签或 GitHub Release。

## 开始游玩

直接双击根目录 `index.html`，或构建后双击 `dist/index.html`，无需联网。推荐桌面 Chrome；移动浏览器触摸操作也已通过模拟验收。

- **自由探索**：默认暂停，点击棋盘投沙；也可填写坐标和粒数，或用方向键选格、Enter/Space 投沙。棋盘提供 33/65/129 三档。
- **循环投沙**：单次按钮旁点击“开始循环投沙”，按所选坐标和粒数自动循环并处理崩塌；默认半秒一次，可设 100..5000ms。点击停止或暂停结束；刷新/重置/切模式也会停止。
- **观察雪崩**：单步处理一轮同步波；运行可调速度；稳定化快速计算并允许暂停。满 4 粒向四邻各送一粒，越界粒数流失，边角阈值仍为 4。
- **实验预设**：空棋盘、中心 4096 粒、全盘 3 粒后中心加一粒。不稳定时新投沙排队，稳定后按序处理。
- **教学挑战**：六关全部开放，点击虚线格投一粒。稳定后全棋盘与目标完全一致才通关；可重置、撤销，历史完成记录保留。
- **保存实验**：修改后自动保存，刷新恢复保持暂停；导出/导入 JSON 可迁移数据。进行中挑战恢复到最近稳定动作之前。

单次投沙上限 10 万粒，本局初始＋累计投入上限 100 万，队列最多 100 项，导入上限 2MiB。重要实验请导出备份；清除存档只影响本游戏。

## 开发与验证

需要 Node.js >=20.19.0；运行、构建与领域测试无第三方依赖，不需要安装包。

```sh
node scripts/check.mjs
node --test
node scripts/sync-levels.mjs --check
node scripts/verify-levels.mjs
node scripts/build.mjs
node scripts/serve.mjs
```

预览服务器默认 `http://127.0.0.1:4178/`，仅监听本机。`/assets/games/abelian-sandpile/` 用于游戏端子路径检查。也可用对应的 npm scripts。

浏览器验收：先构建，再执行 `node scripts/verify-browser.mjs`。开发环境需另行准备 Playwright 和 Chrome；通过 `PLAYWRIGHT_MODULE` 可指定已有模块绝对路径，`PLAYWRIGHT_CHANNEL` 默认 chrome。脚本自动临时启动本项目 4180 端口服务器；指定 `PREVIEW_URL` 可使用已有服务。工具及开发依赖不会进入游戏产物。循环验收执行 `node scripts/verify-repeat-browser.mjs`，先启动预览服务，默认 4180，可用 `PREVIEW_URL` 指定。纯引擎性能参考执行 `node scripts/benchmark.mjs`。

本版已通过 **34 项 Node 测试、6 关可达性/最少步数证明和 24 项真实 Chrome 浏览器操作验收**，截图和限制见[循环投沙测试报告](doc/循环投沙测试报告-v0.1.1.md)及[首版报告](doc/第一版本测试报告.md)。移动触屏为浏览器模拟，Android 真机尚未验证。

## 项目结构

```text
src/domain/       沙堆引擎、挑战规则、已同步的关卡数据
src/storage/      严格存档校验和本地持久化
src/controller.js 可取消调度、输入队列、模式协调
src/renderer.js   Canvas 渲染和坐标命中
src/app.js        页面操作、保存、浏览器文件流程
 data/challenges/ 正式六关及保留的历史草案示例
 tests/           独立参考引擎、领域/存档/控制器/工程测试
 scripts/         检查、证明、构建、本地预览和可选浏览器验收
 doc/             规划、来源、验证报告与证据
 dist/            11 份运行资源及摘要清单（生成、不提交）
```

## 文档与工作边界

[需求与测试用例](doc/需求与测试用例.md) · [设计文档](doc/设计文档.md) · [实施计划](doc/实施计划.md) · [版本规划](doc/版本迭代规划.md) · [关卡证明](doc/关卡验证报告.md) · [玩法调研](doc/玩法调研.md) · [大厅接入约束](doc/游戏大厅接入规范.md)。

沿用 EML 的 build-tested-mini-app / plan-driven-frontend-dev：先规划，每个逻辑单元独立提交推送，以真实证据更新 VERIFIED。

**本项目只开发单个游戏。** 游戏资源使用相对路径及独立 `abelian-sandpile.` 存档键；候选合约 `game-hub.integration.json` 记录来源和资源。大厅扩展、注册、原生桥、合集构建及其它游戏回归由大厅项目负责，当前没有宣称已接入大厅。

连续投沙已按追加需求提前完成；v0.2.0 的其余规划为随机雨、缩放平移和图像导出。**v1.0.0 完成前只开发本地网页，之后再生成和发布 APK。**

许可：[MIT](LICENSE)。贡献与安全问题见 [CONTRIBUTING](CONTRIBUTING.md) 和 [SECURITY](SECURITY.md)。
