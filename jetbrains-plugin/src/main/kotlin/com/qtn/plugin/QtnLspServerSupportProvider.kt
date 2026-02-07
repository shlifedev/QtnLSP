package com.qtn.plugin

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.extensions.PluginId
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.LspServerSupportProvider
import com.intellij.platform.lsp.api.LspServerSupportProvider.LspServerStarter
import com.intellij.platform.lsp.api.ProjectWideLspServerDescriptor
import kotlin.io.path.exists

class QtnLspServerSupportProvider : LspServerSupportProvider {
    override fun fileOpened(project: Project, file: VirtualFile, serverStarter: LspServerStarter) {
        if (file.extension == "qtn") {
            serverStarter.ensureServerStarted(QtnLspServerDescriptor(project))
        }
    }
}

class QtnLspServerDescriptor(project: Project) : ProjectWideLspServerDescriptor(project, "QTN") {
    override fun isSupportedFile(file: VirtualFile): Boolean = file.extension == "qtn"

    override fun createInitializationOptions(): Any {
        val locale = java.util.Locale.getDefault().language  // "ko", "en", etc.
        return mapOf("locale" to locale)
    }

    override fun createCommandLine(): GeneralCommandLine {
        // Find the bundled language server
        val plugin = PluginManagerCore.getPlugin(PluginId.getId("com.qtn.syntax-highlighting"))
        val pluginPath = plugin?.pluginPath
            ?: throw IllegalStateException("QTN plugin not found")

        val serverPath = pluginPath.resolve("language-server/out/server.js")

        if (!serverPath.exists()) {
            throw IllegalStateException("QTN language server not found at: $serverPath")
        }

        return GeneralCommandLine("node", serverPath.toString(), "--stdio")
    }
}
