# 领域模块

sandpile.js 提供规则、棋盘、同步波、快速稳定化及物理账本；challenge.js 提供关卡校验、约束、精确目标、撤销和广搜；levels.js 由正式 JSON 同步生成。

模块采用 UMD，在浏览器和 Node 中同源运行，不访问 DOM、Canvas、存储或宿主桥。独立朴素参考引擎和性质测试位于 tests/，关卡证明工具位于 scripts/。规则及上限见 doc/需求与测试用例.md。
