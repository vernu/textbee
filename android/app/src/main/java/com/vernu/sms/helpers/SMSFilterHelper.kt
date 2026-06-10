package com.vernu.sms.helpers

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.vernu.sms.AppConstants
import com.vernu.sms.models.SMSFilterRule

object SMSFilterHelper {
    private const val TAG = "SMSFilterHelper"

    enum class FilterMode { ALLOW_LIST, BLOCK_LIST }

    class FilterConfig {
        @get:JvmName("isEnabled") var enabled: Boolean = false
        var mode: FilterMode = FilterMode.BLOCK_LIST
        var rules: MutableList<SMSFilterRule> = mutableListOf()
    }

    @JvmStatic
    fun loadFilterConfig(context: Context): FilterConfig {
        val json = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_SMS_FILTER_CONFIG_KEY, null
        )
        if (json.isNullOrEmpty()) return FilterConfig()
        return try {
            val type = object : TypeToken<FilterConfig>() {}.type
            Gson().fromJson<FilterConfig>(json, type) ?: FilterConfig()
        } catch (e: Exception) {
            Log.e(TAG, "Error loading filter config: ${e.message}")
            FilterConfig()
        }
    }

    @JvmStatic
    fun saveFilterConfig(context: Context, config: FilterConfig) {
        try {
            SharedPreferenceHelper.setSharedPreferenceString(
                context,
                AppConstants.SHARED_PREFS_SMS_FILTER_CONFIG_KEY,
                Gson().toJson(config)
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error saving filter config: ${e.message}")
        }
    }

    @JvmStatic
    fun shouldProcessSMS(sender: String?, message: String?, context: Context): Boolean {
        val config = loadFilterConfig(context)
        if (!config.enabled) return true
        if (config.rules.isEmpty()) return true
        val matchesAnyRule = config.rules.any { it.matches(sender, message) }
        return if (config.mode == FilterMode.ALLOW_LIST) matchesAnyRule else !matchesAnyRule
    }

    @JvmStatic
    fun shouldProcessSMS(sender: String?, context: Context): Boolean =
        shouldProcessSMS(sender, null, context)
}
