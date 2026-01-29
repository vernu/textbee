package com.vernu.sms.helpers;

import android.content.Context;
import android.util.Log;

import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.vernu.sms.AppConstants;
import com.vernu.sms.workers.HeartbeatWorker;

import java.util.concurrent.TimeUnit;

public class HeartbeatManager {
    private static final String TAG = "HeartbeatManager";
    private static final int MIN_INTERVAL_MINUTES = 15; // Android WorkManager minimum

    public static void scheduleHeartbeat(Context context) {
        // Get interval from shared preferences (default 30 minutes)
        int intervalMinutes = SharedPreferenceHelper.getSharedPreferenceInt(
            context,
            AppConstants.SHARED_PREFS_HEARTBEAT_INTERVAL_MINUTES_KEY,
            30
        );

        // Enforce minimum interval
        if (intervalMinutes < MIN_INTERVAL_MINUTES) {
            Log.w(TAG, "Interval " + intervalMinutes + " minutes is less than minimum " + MIN_INTERVAL_MINUTES + " minutes, using minimum");
            intervalMinutes = MIN_INTERVAL_MINUTES;
        }

        Log.d(TAG, "Scheduling heartbeat with interval: " + intervalMinutes + " minutes");

        // Cancel any existing heartbeat work
        cancelHeartbeat(context);

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

        // Enqueue the work
        WorkManager.getInstance(context)
            .enqueue(heartbeatWork);

        Log.d(TAG, "Heartbeat scheduled successfully");
    }

    public static void cancelHeartbeat(Context context) {
        Log.d(TAG, "Cancelling heartbeat work");
        WorkManager.getInstance(context)
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
