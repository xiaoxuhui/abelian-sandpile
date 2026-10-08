# 阿贝尔沙滩项目工作约定

## 工作边界

用户明确要求：本窗口只负责开发阿贝尔沙滩单个游戏。不得在本项目任务中扩展游戏大厅功能、注册第五游戏、修改宿主原生桥、构建/发布大厅 APK 或修改其它游戏仓库。

游戏端可以遵守大厅的离线资源、相对路径、存档前缀、许可和资源摘要约束，并交付来源资料。大厅功能是外部前置条件，由大厅项目处理；不要把它列成本游戏的实施任务或完成条件。

## 开发纪律

- 沿用 `build-tested-mini-app` 和 `plan-driven-frontend-dev`；先读本项目 doc/需求与测试用例.md、doc/设计文档.md、doc/实施计划.md。
- 规则或交互改动先定义验收用例，小步实现，每功能独立 commit。
- `node scripts/check.mjs`、`node --test`、`node scripts/build.mjs` 必须实际执行；页面变化做真实浏览器桌面/移动交互验证。
- 计划按 PENDING → COMPLETE → VERIFIED 更新；未执行或缺证据的检查不得写通过。
- 关卡最少步数必须用可重复工具逐层穷举；参考解只证明可达。
- 存储只用 `abelian-sandpile.` 前缀，禁止 localStorage.clear()/sessionStorage.clear()；导入失败不替换原数据。
- 本地版本、源 SHA、存档合同和宿主协议分开记录；草案/已实现/已发行状态不能混用。
- 授权记录：2026-10-08 用户授权骨架与规划，并随后明确要求直接创建远程仓库、提交和推送。当前仓库 xiaoxuhui/abelian-sandpile；按相同 Skill，每个切片提交后推送并用 ls-remote 核对。完整游戏实现、标签、Release 和独立 APK 仍按后续明确授权处理。
