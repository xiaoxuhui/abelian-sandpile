# 阿贝尔沙滩

基于 **Abelian sandpile（阿贝尔沙堆）** 的离线数学小游戏，计划同时提供自由探索和挑战关卡。

当前为 **0.1.0-dev.0 项目骨架**，已完成调研与初版规划，尚无可玩的沙堆引擎或正式关卡。项目保持本地独立仓库，未来可按 MIT 许可开源并接入游戏大厅。

## 阅读文档

- [需求与测试用例](doc/需求与测试用例.md)：模型、探索模式、拟议关卡规则和验收矩阵。
- [玩法调研](doc/玩法调研.md)：文献来源及产品推导。
- [设计文档](doc/设计文档.md)：领域、渲染、存储、任务取消和资源边界。
- [实施计划](doc/实施计划.md)：按 PENDING / COMPLETE / VERIFIED 记录真实进度。
- [游戏大厅接入规范](doc/游戏大厅接入规范.md)：现有宿主约束与第五来源所需改动。
- [项目启动验证报告](doc/项目启动验证报告.md)：本次工程与浏览器检查证据。

## 本地操作

需要 Node.js >=20.19；无第三方依赖，不需要安装包。

```sh
node scripts/check.mjs
node --test
node scripts/build.mjs
node scripts/serve.mjs
```

构建生成 `dist/index.html` 和本地 CSS/JS，可直接双击打开。开发服务器默认 `http://127.0.0.1:4178/`，只监听本机。`http://127.0.0.1:4178/assets/games/abelian-sandpile/` 用于模拟大厅子路径；它不是 Android WebView 验证。

若 npm 可用，也可执行 `npm test`、`npm run check`、`npm run build`、`npm run serve`。

## 项目结构

```text
doc/               调研、需求、设计、计划与验证记录
src/               当前占位页；预留 domain/ 与 storage/ 边界
data/challenges/   未验证的关卡格式示例
tests/             骨架、离线资源和构建合同测试
scripts/           零依赖检查、构建与本地预览
dist/              生成的离线静态产物（不提交）
release/           后续发行产物占位（当前无发行文件）
```

## 开发与接入

沿用 EML 的 `build-tested-mini-app` 和 `plan-driven-frontend-dev`：先写需求/设计/计划，每个逻辑单元独立 commit；测试和真实浏览器交互证据齐全才标 VERIFIED。玩法阶段遵循参考引擎交叉验证和关卡穷举。

`game-hub.integration.json` 是候选合约，尚无远端发布地址、宿主版本承诺或签名。现有大厅固定四来源，正式加入需要另行扩展宿主、注册图标/原生桥并回归全部游戏。占位页面不访问存储；未来仅使用 `abelian-sandpile.` 前缀，不清空共享 origin 数据。

**工作边界：本项目/本窗口只开发单个游戏。** 大厅扩展、注册、宿主原生桥、合集 APK 构建与其它游戏回归由大厅项目负责，不列入本游戏实施计划。

许可：[MIT](LICENSE)。贡献与安全问题见 [CONTRIBUTING](CONTRIBUTING.md) 和 [SECURITY](SECURITY.md)。
