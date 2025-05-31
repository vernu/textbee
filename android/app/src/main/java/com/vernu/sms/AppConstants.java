package com.vernu.sms;

import android.Manifest;

public class AppConstants {
    public static final String API_BASE_URL = "https://api.textbee.dev/api/v1/";
    public static final String[] requiredPermissions = new String[]{
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_PHONE_STATE
    };
    public static final String SHARED_PREFS_DEVICE_ID_KEY = "DEVICE_ID";
    public static final String SHARED_PREFS_API_KEY_KEY = "API_KEY";
    public static final String SHARED_PREFS_GATEWAY_ENABLED_KEY = "GATEWAY_ENABLED";
    public static final String SHARED_PREFS_PREFERRED_SIM_KEY = "PREFERRED_SIM";
    public static final String SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY = "RECEIVE_SMS_ENABLED";
    public static final String SHARED_PREFS_TRACK_SENT_SMS_STATUS_KEY = "TRACK_SENT_SMS_STATUS";
    public static final String SHARED_PREFS_LAST_VERSION_CODE_KEY = "LAST_VERSION_CODE";
    public static final String SHARED_PREFS_LAST_VERSION_NAME_KEY = "LAST_VERSION_NAME";
    public static final String SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY = "STICKY_NOTIFICATION_ENABLED";
}
