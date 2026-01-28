package com.vernu.sms.helpers;

import android.content.Context;
import android.util.Log;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.vernu.sms.AppConstants;
import com.vernu.sms.workers.HeartbeatWorker;

import java.util.concurrent.TimeUnit;

public class HeartbeatManager {
    private static final String TAG = "HeartbeatManager";
    private static final int MIN_INTERVAL_MINUTES = 15; // Android WorkManager minimum
    private static final String UNIQUE_WORK_NAME = "heartbeat_unique_work";

    public static void scheduleHeartbeat(Context context) {
        // Use application context to ensure WorkManager works even when app is closed
        Context appContext = context.getApplicationContext();
        
        // Get interval from shared preferences (default 30 minutes)
        int intervalMinutes = SharedPreferenceHelper.getSharedPreferenceInt(
            appContext,
            AppConstants.SHARED_PREFS_HEARTBEAT_INTERVAL_MINUTES_KEY,
            30
        );

        // Enforce minimum interval
        if (intervalMinutes < MIN_INTERVAL_MINUTES) {
            Log.w(TAG, "Interval " + intervalMinutes + " minutes is less than minimum " + MIN_INTERVAL_MINUTES + " minutes, using minimum");
            intervalMinutes = MIN_INTERVAL_MINUTES;
        }

        Log.d(TAG, "Scheduling heartbeat with interval: " + intervalMinutes + " minutes");

        // Create constraints
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();

        // Create periodic work request
        PeriodicWorkRequest heartbeatWork = new PeriodicWorkRequest.Builder(
            HeartbeatWorker.class,
            intervalMinutes,
            TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .addTag(AppConstants.HEARTBEAT_WORK_TAG)
            .build();

        // Use enqueueUniquePeriodicWork to ensure only one periodic work exists
        // This ensures the work persists across app restarts and device reboots
        WorkManager.getInstance(appContext)
            .enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.REPLACE,
                heartbeatWork
            );

        Log.d(TAG, "Heartbeat scheduled successfully with unique work name: " + UNIQUE_WORK_NAME);
    }

    public static void cancelHeartbeat(Context context) {
        Log.d(TAG, "Cancelling heartbeat work");
        Context appContext = context.getApplicationContext();
        
        // Cancel by unique work name (more reliable)
        WorkManager.getInstance(appContext)
            .cancelUniqueWork(UNIQUE_WORK_NAME);
        
        // Also cancel by tag as fallback
        WorkManager.getInstance(appContext)
            .cancelAllWorkByTag(AppConstants.HEARTBEAT_WORK_TAG);
    }

    public static void triggerHeartbeat(Context context) {
        // This can be used for testing - trigger immediate heartbeat
        Log.d(TAG, "Triggering immediate heartbeat");
        // For immediate execution, we could create a OneTimeWorkRequest
        // but for now, just reschedule which will run soon
        scheduleHeartbeat(context);
    }
}
