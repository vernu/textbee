package com.vernu.sms.helpers;

import android.content.Context;
import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.vernu.sms.AppConstants;
import com.vernu.sms.models.SMSFilterRule;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class SMSFilterHelper {
    private static final String TAG = "SMSFilterHelper";

    public enum FilterMode {
        ALLOW_LIST,
        BLOCK_LIST
    }

    public static class FilterConfig {
        private boolean enabled = false;
        private FilterMode mode = FilterMode.BLOCK_LIST; // Default to block list
        private List<SMSFilterRule> rules = new ArrayList<>();

        public FilterConfig() {
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public FilterMode getMode() {
            return mode;
        }

        public void setMode(FilterMode mode) {
            this.mode = mode;
        }

        public List<SMSFilterRule> getRules() {
            return rules;
        }

        public void setRules(List<SMSFilterRule> rules) {
            this.rules = rules != null ? rules : new ArrayList<>();
        }
    }

    /**
     * Load filter configuration from SharedPreferences
     */
    public static FilterConfig loadFilterConfig(Context context) {
        String json = SharedPreferenceHelper.getSharedPreferenceString(
            context,
            AppConstants.SHARED_PREFS_SMS_FILTER_CONFIG_KEY,
            null
        );

        if (json == null || json.isEmpty()) {
            return new FilterConfig();
        }

        try {
            Gson gson = new Gson();
            Type type = new TypeToken<FilterConfig>() {}.getType();
            FilterConfig config = gson.fromJson(json, type);
            return config != null ? config : new FilterConfig();
        } catch (Exception e) {
            Log.e(TAG, "Error loading filter config: " + e.getMessage());
            return new FilterConfig();
        }
    }

    /**
     * Save filter configuration to SharedPreferences
     */
    public static void saveFilterConfig(Context context, FilterConfig config) {
        try {
            Gson gson = new Gson();
            String json = gson.toJson(config);
            SharedPreferenceHelper.setSharedPreferenceString(
                context,
                AppConstants.SHARED_PREFS_SMS_FILTER_CONFIG_KEY,
                json
            );
        } catch (Exception e) {
            Log.e(TAG, "Error saving filter config: " + e.getMessage());
        }
    }

    /**
     * Check if an SMS should be processed based on filter configuration
     * @param sender The sender phone number
     * @param message The message content
     * @param context Application context
     * @return true if SMS should be processed, false if it should be filtered out
     */
    public static boolean shouldProcessSMS(String sender, String message, Context context) {
        FilterConfig config = loadFilterConfig(context);

        // If filter is disabled, process all SMS
        if (!config.isEnabled()) {
            return true;
        }

        // If no rules, process all SMS (empty filter doesn't block anything)
        if (config.getRules() == null || config.getRules().isEmpty()) {
            return true;
        }

        // Check if sender and/or message matches any rule
        boolean matchesAnyRule = false;
        for (SMSFilterRule rule : config.getRules()) {
            if (rule.matches(sender, message)) {
                matchesAnyRule = true;
                break;
            }
        }

        // Apply filter mode
        if (config.getMode() == FilterMode.ALLOW_LIST) {
            // Only process if matches a rule
            return matchesAnyRule;
        } else {
            // Block list: process if it does NOT match any rule
            return !matchesAnyRule;
        }
    }

    /**
     * Legacy method for backward compatibility - checks sender only
     */
    public static boolean shouldProcessSMS(String sender, Context context) {
        return shouldProcessSMS(sender, null, context);
    }
}
