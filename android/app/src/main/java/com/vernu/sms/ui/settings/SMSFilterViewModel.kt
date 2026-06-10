package com.vernu.sms.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.vernu.sms.helpers.SMSFilterHelper
import com.vernu.sms.models.SMSFilterRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SMSFilterViewModel(app: Application) : AndroidViewModel(app) {

    private val _config = MutableStateFlow(SMSFilterHelper.loadFilterConfig(app))
    val config: StateFlow<SMSFilterHelper.FilterConfig> = _config.asStateFlow()

    fun setEnabled(enabled: Boolean) = mutate { it.enabled = enabled }

    fun setMode(mode: SMSFilterHelper.FilterMode) = mutate { it.mode = mode }

    fun addRule(rule: SMSFilterRule) = mutate { it.rules.add(rule) }

    fun updateRule(index: Int, rule: SMSFilterRule) = mutate { it.rules[index] = rule }

    fun deleteRule(index: Int) = mutate { it.rules.removeAt(index) }

    private fun mutate(block: (SMSFilterHelper.FilterConfig) -> Unit) {
        val current = _config.value
        val copy = SMSFilterHelper.FilterConfig().apply {
            enabled = current.enabled
            mode = current.mode
            rules = ArrayList(current.rules)
        }
        block(copy)
        _config.value = copy
        SMSFilterHelper.saveFilterConfig(getApplication(), copy)
    }
}
