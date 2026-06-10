package com.vernu.sms.helpers

import android.content.Context

object SharedPreferenceHelper {
    private const val PREF_FILE = "PREF"

    @JvmStatic
    fun setSharedPreferenceString(context: Context, key: String, value: String) {
        context.getSharedPreferences(PREF_FILE, 0).edit().putString(key, value).apply()
    }

    @JvmStatic
    fun setSharedPreferenceInt(context: Context, key: String, value: Int) {
        context.getSharedPreferences(PREF_FILE, 0).edit().putInt(key, value).apply()
    }

    @JvmStatic
    fun setSharedPreferenceBoolean(context: Context, key: String, value: Boolean) {
        context.getSharedPreferences(PREF_FILE, 0).edit().putBoolean(key, value).apply()
    }

    @JvmStatic
    fun getSharedPreferenceString(context: Context, key: String, defValue: String?): String? {
        return context.getSharedPreferences(PREF_FILE, 0).getString(key, defValue)
    }

    @JvmStatic
    fun getSharedPreferenceInt(context: Context, key: String, defValue: Int): Int {
        return context.getSharedPreferences(PREF_FILE, 0).getInt(key, defValue)
    }

    @JvmStatic
    fun getSharedPreferenceBoolean(context: Context, key: String, defValue: Boolean): Boolean {
        return context.getSharedPreferences(PREF_FILE, 0).getBoolean(key, defValue)
    }

    @JvmStatic
    fun clearSharedPreference(context: Context, key: String) {
        context.getSharedPreferences(PREF_FILE, 0).edit().remove(key).apply()
    }
}
