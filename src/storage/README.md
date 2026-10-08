# 存储模块

persistence.js 实现 abelian-sandpile-save-v1 包络的严格校验、JSON 编解码和三键持久化。experiment.v1 保存完整权威包络，progress.v1/settings.v1 为镜像；恢复不拼接镜像。

键全部使用 abelian-sandpile. 前缀，清除仅删除本项目三键；导入先校验再确认替换。存储失败保留内存，页面允许导出。只保存数据与稳定挑战检查点，不保存定时器，恢复暂停。设计和测试证据见 doc/设计文档.md、doc/第一版本测试报告.md。
