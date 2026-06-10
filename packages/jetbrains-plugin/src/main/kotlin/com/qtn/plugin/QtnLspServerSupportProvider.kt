package com.qtn.plugin

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.configurations.PathEnvironmentVariableUtil
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.SystemInfo
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.LspServerSupportProvider
import com.intellij.platform.lsp.api.LspServerSupportProvider.LspServerStarter
import com.intellij.platform.lsp.api.ProjectWideLspServerDescriptor
import java.io.File
import java.nio.file.Path
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.io.path.exists

class QtnLspServerSupportProvider : LspServerSupportProvider {
    override fun fileOpened(project: Project, file: VirtualFile, serverStarter: LspServerStarter) {
        if (file.extension != "qtn") return

        // TextMate 하이라이팅은 LSP와 무관하게 동작하므로, 서버를 못 띄우는 상황에서는
        // 예외로 죽이지 말고 안내만 하고 조용히 빠진다.
        val serverPath = QtnLspLauncher.findServerJs()
        if (serverPath == null) {
            QtnLspLauncher.notifyOnce(
                project,
                "QTN language server is missing from the plugin distribution. " +
                    "Syntax highlighting still works; reinstall the plugin to restore IntelliSense."
            )
            return
        }

        val nodePath = QtnLspLauncher.findNode()
        if (nodePath == null) {
            QtnLspLauncher.notifyOnce(
                project,
                "Node.js 18+ was not found. QTN IntelliSense is disabled; syntax highlighting still works. " +
                    "Install Node.js from https://nodejs.org/ and reopen the project."
            )
            return
        }

        serverStarter.ensureServerStarted(QtnLspServerDescriptor(project, nodePath, serverPath))
    }
}

internal object QtnLspLauncher {
    private val notified = AtomicBoolean(false)

    fun findServerJs(): Path? =
        QtnPluginPaths.getPluginPath()
            ?.resolve("language-server/out/server.js")
            ?.takeIf { it.exists() }

    fun findNode(): String? {
        val exeName = if (SystemInfo.isWindows) "node.exe" else "node"
        PathEnvironmentVariableUtil.findInPath(exeName)?.let { return it.absolutePath }

        // GUI로 실행된 IDE는 셸 PATH를 물려받지 못하는 경우가 있어 흔한 설치 경로를 추가 확인
        val fallbacks = if (SystemInfo.isWindows) {
            listOfNotNull(
                System.getenv("ProgramFiles")?.let { "$it\\nodejs\\node.exe" },
                System.getenv("LOCALAPPDATA")?.let { "$it\\Programs\\nodejs\\node.exe" }
            )
        } else {
            listOf("/usr/local/bin/node", "/opt/homebrew/bin/node", "/usr/bin/node")
        }
        return fallbacks.firstOrNull { File(it).canExecute() }
    }

    fun notifyOnce(project: Project, message: String) {
        if (!notified.compareAndSet(false, true)) return
        NotificationGroupManager.getInstance()
            .getNotificationGroup("QTN Language Server")
            .createNotification("QTN Language Support", message, NotificationType.WARNING)
            .notify(project)
    }
}

class QtnLspServerDescriptor(
    project: Project,
    private val nodePath: String,
    private val serverPath: Path,
) : ProjectWideLspServerDescriptor(project, "QTN") {
    override fun isSupportedFile(file: VirtualFile): Boolean = file.extension == "qtn"

    override fun createInitializationOptions(): Any {
        val locale = java.util.Locale.getDefault().language  // "ko", "en", etc.
        return mapOf("locale" to locale)
    }

    override fun createCommandLine(): GeneralCommandLine =
        GeneralCommandLine(nodePath, serverPath.toString(), "--stdio")
}
