package com.vernu.sms;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.vernu.sms.services.StickyNotificationService;
import com.vernu.sms.helpers.SharedPreferenceHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class TextBeeUtils {
    private static final String TAG = "TextBeeUtils";
    
    public static boolean isPermissionGranted(Context context, String permission) {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED;
    }

    public static List<SubscriptionInfo> getAvailableSimSlots(Context context) {

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return new ArrayList<>();
        }

        SubscriptionManager subscriptionManager = SubscriptionManager.from(context);
        return subscriptionManager.getActiveSubscriptionInfoList();

    }

    public static void startStickyNotificationService(Context context) {
        if(!isPermissionGranted(context, Manifest.permission.RECEIVE_SMS)){
            return;
        }
        
        // Only start service if user has enabled sticky notification
        boolean stickyNotificationEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                context,
                AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY,
                false
        );
        
        if (stickyNotificationEnabled) {
            Intent notificationIntent = new Intent(context, StickyNotificationService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(notificationIntent);
            } else {
                context.startService(notificationIntent);
            }
            Log.i(TAG, "Starting sticky notification service");
        } else {
            Log.i(TAG, "Sticky notification disabled by user, not starting service");
        }
    }

    public static void stopStickyNotificationService(Context context) {
        Intent notificationIntent = new Intent(context, StickyNotificationService.class);
        context.stopService(notificationIntent);
        Log.i(TAG, "Stopping sticky notification service");
    }
    
    /**
     * Log a non-fatal exception to Crashlytics with additional context information
     * 
     * @param throwable The exception to log
     * @param message A message describing what happened
     * @param customData Optional map of custom key-value pairs to add as context
     */
    public static void logException(Throwable throwable, String message, Map<String, Object> customData) {
        try {
            Log.e(TAG, message, throwable);
            
            FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
            crashlytics.log(message);
            
            // Add any custom data as key-value pairs
            if (customData != null) {
                for (Map.Entry<String, Object> entry : customData.entrySet()) {
                    if (entry.getValue() instanceof String) {
                        crashlytics.setCustomKey(entry.getKey(), (String) entry.getValue());
                    } else if (entry.getValue() instanceof Boolean) {
                        crashlytics.setCustomKey(entry.getKey(), (Boolean) entry.getValue());
                    } else if (entry.getValue() instanceof Integer) {
                        crashlytics.setCustomKey(entry.getKey(), (Integer) entry.getValue());
                    } else if (entry.getValue() instanceof Long) {
                        crashlytics.setCustomKey(entry.getKey(), (Long) entry.getValue());
                    } else if (entry.getValue() instanceof Float) {
                        crashlytics.setCustomKey(entry.getKey(), (Float) entry.getValue());
                    } else if (entry.getValue() instanceof Double) {
                        crashlytics.setCustomKey(entry.getKey(), (Double) entry.getValue());
                    } else if (entry.getValue() != null) {
                        crashlytics.setCustomKey(entry.getKey(), entry.getValue().toString());
                    }
                }
            }
            
            // Record the exception
            crashlytics.recordException(throwable);
        } catch (Exception e) {
            Log.e(TAG, "Error logging exception to Crashlytics", e);
        }
    }
    
    /**
     * Simplified method to log a non-fatal exception with just a message
     */
    public static void logException(Throwable throwable, String message) {
        logException(throwable, message, null);
    }
}
