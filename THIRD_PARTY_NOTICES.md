# 第三方许可与来源

v0.1.0 没有第三方运行库、下载字体、图片、音频或复用关卡。引擎、关卡、Canvas 渲染为本项目实现。Node 内置模块用于开发测试/构建，不随网页分发。

可选真实浏览器验收使用开发宿主已有 Playwright 和 Chrome；二者不打包进 dist，不是网页或构建依赖。验收浏览器版本见 doc/第一版本测试报告.md。

数学与玩法文献来源见[玩法调研](doc/玩法调研.md)，库选择见[设计文档](doc/设计文档.md)。引用文献不表示原图像、代码或文本获得本项目 MIT 许可；未复制这些素材或被评估项目源码。

未来新增库或素材须登记精确版本、作者、来源和许可证，在发行及大厅资源包中保留所需声明。

## v0.1.2 Android 外壳

WebView工程及同步／结构测试／APK解析工具沿用 xiaoxuhui/mini-app-harness 的 web-app-to-android-apk 技能模板，许可按该来源MIT声明。图标为本项目可复现几何绘制，Pillow仅开发使用。

AndroidX core-ktx1.13.1、activity-ktx1.9.2、webkit1.11.0与AndroidX传递库（The Android Open Source Project）、Kotlin1.9.24标准库（JetBrains）采用Apache2.0。完整许可证与声明在 android/app/src/main/res/raw/apache_2_0.txt、third_party_notices.txt，随APK分发。Gradle8.7／AGP8.5.2／Kotlin插件用于构建，不属于网页依赖；AndroidX Test runner1.6.2／JUnit扩展1.2.1只用于测试APK。
