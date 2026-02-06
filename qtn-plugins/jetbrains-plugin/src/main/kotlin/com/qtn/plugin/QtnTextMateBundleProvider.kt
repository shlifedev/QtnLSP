package com.qtn.plugin

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.extensions.PluginId
import org.jetbrains.plugins.textmate.api.TextMateBundleProvider

class QtnTextMateBundleProvider : TextMateBundleProvider {
    override fun getBundles(): List<TextMateBundleProvider.PluginBundle> {
        val pluginPath = PluginManagerCore.getPlugin(PluginId.getId("com.qtn.syntax-highlighting"))
            ?.pluginPath ?: return emptyList()
        return listOf(
            TextMateBundleProvider.PluginBundle(
                "qtn",
                pluginPath.resolve("bundles/qtn.tmbundle")
            )
        )
    }
}
