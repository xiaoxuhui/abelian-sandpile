package com.xiaoxuhui.abeliansandpile

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.util.concurrent.Executors

/** 单游戏离线外壳，所有数学及存档校验仍由同源网页实现。 */
class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingExport: String? = null
    private val writer = Executors.newSingleThreadExecutor()

    private val saveLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val text = pendingExport
        pendingExport = null
        if (text != null) {
            if (uri == null) exportResult("已取消导出，原存档保留。", true)
            else writer.execute {
                val result = runCatching {
                    contentResolver.openOutputStream(uri, "wt")?.use {
                        it.write(text.toByteArray(Charsets.UTF_8))
                    } ?: error("无法写入所选文件")
                }
                runOnUiThread {
                    if (result.isSuccess) exportResult("存档已保存到所选位置。", true)
                    else exportResult("保存失败：${result.exceptionOrNull()?.message ?: "未知错误"}", false)
                }
            }
        }
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = filePathCallback ?: return@registerForActivityResult
        filePathCallback = null
        callback.onReceiveValue(
            if (result.resultCode == RESULT_OK) result.data?.data?.let { arrayOf(it) } else null
        )
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = buildWebView()
        setContentView(webView)
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            view.updatePadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack()
                else { isEnabled = false; onBackPressedDispatcher.onBackPressed() }
            }
        })
        // 始终重载内置入口；持久数据由网页稳定检查点恢复，避免仅恢复历史却空白。
        webView.loadUrl(PAGE_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun buildWebView(): WebView {
        val view = WebView(this)
        view.tag = "abelian-game-webview"
        view.setBackgroundColor(Color.parseColor("#F4EFE4"))
        view.overScrollMode = View.OVER_SCROLL_NEVER
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            // 只用于系统文件选择器授予的 content URI，直接导航仍受 URL 门禁保护。
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            mediaPlaybackRequiresUserGesture = true
            textZoom = 100
        }
        val assetLoader = WebViewAssetLoader.Builder().setDomain(ASSET_DOMAIN)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        view.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val uri = request.url
                if (isLocal(uri)) assetLoader.shouldInterceptRequest(uri)?.let { return it }
                return WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", emptyMap(), ByteArrayInputStream(byteArrayOf()))
            }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (isLocal(uri)) return false
                if (request.isForMainFrame && uri.scheme in listOf("https", "http", "mailto")) {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                }
                return true
            }
        }
        view.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(webView: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                return try {
                    fileChooserLauncher.launch(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/json", "text/plain", "application/octet-stream"))
                    })
                    true
                } catch (error: Exception) {
                    filePathCallback = null
                    callback.onReceiveValue(null)
                    true
                }
            }
        }
        view.addJavascriptInterface(Bridge(), "AbelianAndroid")
        return view
    }

    private inner class Bridge {
        @JavascriptInterface
        fun saveFile(name: String, content: String) {
            runOnUiThread {
                if (pendingExport != null) exportResult("已有保存选择窗口，请先完成或取消。", false)
                else if (content.isEmpty() || content.toByteArray(Charsets.UTF_8).size > MAX_EXPORT_BYTES) {
                    exportResult("存档为空或超过 2MiB，未导出。", false)
                } else if (isLocal(Uri.parse(webView.url ?: ""))) {
                    pendingExport = content
                    try { saveLauncher.launch(sanitizeName(name)) }
                    catch (error: Exception) {
                        pendingExport = null
                        exportResult("无法打开保存窗口：${error.message}", false)
                    }
                }
            }
        }
    }

    private fun exportResult(message: String, ok: Boolean) {
        if (isDestroyed) return
        val detail = JSONObject().put("message", message).put("ok", ok)
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('abelian-export-result',{detail:$detail}));", null)
    }

    override fun onPause() {
        webView.evaluateJavascript("window.dispatchEvent(new Event('pagehide'));", null)
        super.onPause()
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        filePathCallback = null
        pendingExport = null
        webView.removeJavascriptInterface("AbelianAndroid")
        webView.destroy()
        writer.shutdown()
        super.onDestroy()
    }

    private fun sanitizeName(name: String): String = name.replace(Regex("[\\\\/:*?\"<>|]"), "_").trim()
        .take(120).takeUnless { it.isEmpty() || it == "." || it == ".." } ?: "abelian-sandpile-save-v1.json"

    companion object {
        private const val ASSET_DOMAIN = "appassets.androidplatform.net"
        private const val ASSET_FILE = "index.html"
        private const val PAGE_URL = "https://$ASSET_DOMAIN/assets/$ASSET_FILE"
        private const val MAX_EXPORT_BYTES = 2 * 1024 * 1024
        private fun isLocal(uri: Uri) = uri.scheme == "https" && uri.host == ASSET_DOMAIN && uri.port == -1 && uri.path?.startsWith("/assets/") == true
    }
}
