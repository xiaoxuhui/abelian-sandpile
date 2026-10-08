package com.xiaoxuhui.abeliansandpile

import android.webkit.WebView
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class OfflineGameTest {
    private fun js(scenario: ActivityScenario<MainActivity>, code: String): String {
        val result = ArrayBlockingQueue<String>(1)
        scenario.onActivity { activity ->
            activity.findViewById<android.view.View>(android.R.id.content)
                .findViewWithTag<WebView>("abelian-game-webview")
                .evaluateJavascript(code) { result.offer(it) }
        }
        return result.poll(10, TimeUnit.SECONDS) ?: error("JavaScript callback timed out")
    }
    private fun ready(scenario: ActivityScenario<MainActivity>, condition: String) {
        val end = System.currentTimeMillis() + 30000
        while (System.currentTimeMillis() < end) {
            if (js(scenario, condition) == "true") return
            Thread.sleep(100)
        }
        assertEquals("condition: $condition", "true", js(scenario, condition))
    }
    @Test fun offlineGameplayClassroomAndLifecycle() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            ready(scenario, "document.documentElement.dataset.ready==='true'")
            assertEquals("true", js(scenario, "location.href==='https://appassets.androidplatform.net/assets/index.html' && typeof AbelianAndroid.saveFile==='function'"))
            assertEquals("10", js(scenario, "document.querySelectorAll('#level option').length"))
            js(scenario,"document.getElementById('drop-selected').click()")
            assertEquals("1", js(scenario,"SandpileApp.board.added"))
            js(scenario,"document.getElementById('repeat-drop').click()")
            ready(scenario,"SandpileApp.board.added>1")
            scenario.moveToState(Lifecycle.State.CREATED)
            scenario.moveToState(Lifecycle.State.RESUMED)
            ready(scenario,"!SandpileApp.running && SandpileApp.pouring===null")
            val added = js(scenario,"SandpileApp.board.added")
            Thread.sleep(500)
            assertEquals(added,js(scenario,"SandpileApp.board.added"))
            scenario.recreate()
            ready(scenario,"document.documentElement.dataset.ready==='true'")
            assertEquals(added,js(scenario,"SandpileApp.board.added"))
            assertEquals("false",js(scenario,"SandpileApp.running"))
            js(scenario,"document.querySelector('[data-mode=challenge]').click(); document.getElementById('level').value='critical-ring'; document.getElementById('level').dispatchEvent(new Event('change')); document.getElementById('step-observe').checked=true;")
            // 真实Canvas事件，(2,3)第一次不崩塌，再投一次触发六波。
            val drop = "(function(){var c=document.getElementById('main-board'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+r.width*2.5/7,clientY:r.top+r.height*3.5/7,bubbles:true}));})()"
            js(scenario,drop);js(scenario,drop)
            assertEquals("6",js(scenario,"SandpileApp.lesson.waves"))
            assertEquals("14",js(scenario,"SandpileApp.lesson.topplings"))
            val physical=js(scenario,"JSON.stringify(SandpileApp.board)")
            js(scenario,"document.getElementById('replay-next').click()")
            assertEquals(physical,js(scenario,"JSON.stringify(SandpileApp.board)"))
            assertTrue(js(scenario,"document.getElementById('lesson-panel').hidden===false")=="true")
        }
    }
}
