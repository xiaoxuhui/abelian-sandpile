# 阿贝尔沙滩 Android 外壳

版本0.1.2／versionCode1；包名com.xiaoxuhui.abeliansandpile；Android7.0+，target/compileSdk34。

按 mini-app-harness/web-app-to-android-apk 模板：AGP8.5.2、Gradle8.7、JDK17。无权限、无网络，固定HTTPS本地origin。网页13文件由dist按白名单同步，不维护副本。

## 构建

先在仓库根运行 `npm run sync:android`、`npm run check:android`、`node --test`，再在android目录运行 `gradlew.bat assembleDebug`（Linux为 `./gradlew assembleDebug`）。本机无SDK时由Android APK工作流构建。产物app/build/outputs/apk/debug/app-debug.apk。

图标用Pillow运行 `python android/tools/make-icons.py`；归档全图和透明前景，各密度及自适应安全区均可复现。

## 文件与生命周期

网页显式调用AbelianAndroid.saveFile，系统创建文档选择保存位置；取消／失败有页面反馈。不使用Blob拦截注入，不会失败后写空文件。导入使用系统ACTION_OPEN_DOCUMENT，只接收用户选中的content URI，仍走网页严格save-v1校验及替换确认。

onPause分发pagehide暂停并保存；旋转由configChanges维持WebView；进程重建始终加载内置入口，由已有稳定存档恢复，保持暂停。系统栏使用WindowInsets，不锁方向；返回先网页历史后退出。

## 签名及发行

app/debug.keystore是本项目固定公开debug证书（密码android，别名androiddebugkey，PKCS12），必须长期保留并提交。它不是私有生产签名，不复用大厅或其它应用签名。此版本以预发行形式提供；当前无前版APK，实际覆盖安装须下一版补验。

每次网页更新同步versionName，并严格递增versionCode。发布前后提取APK v2证书与keystore DER逐字节比较，读取二进制Manifest并比较13文件；保留SHA256及CI/提交记录。不得仅凭构建成功宣称真机兼容。详见doc/安卓发版核对报告-v0.1.2.md。
