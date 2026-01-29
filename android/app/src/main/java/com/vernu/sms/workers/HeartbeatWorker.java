package com.vernu.sms.workers;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.vernu.sms.AppConstants;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.helpers.HeartbeatHelper;

public class HeartbeatWorker extends Worker {
    private static final String TAG = "HeartbeatWorker";

    public HeartbeatWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();

        // Check if device is eligible for heartbeat
        if (!HeartbeatHelper.isDeviceEligibleForHeartbeat(context)) {
            Log.d(TAG, "Device not eligible for heartbeat, skipping");
            return Result.success(); // Not a failure, just skip
        }

        // Get device ID and API key
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(
            context,
            AppConstants.SHARED_PREFS_DEVICE_ID_KEY,
            ""
        );

        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(
            context,
            AppConstants.SHARED_PREFS_API_KEY_KEY,
            ""
        );

        // Send heartbeat using shared helper
        boolean success = HeartbeatHelper.sendHeartbeat(context, deviceId, apiKey);

        if (success) {
            return Result.success();
        } else {
            Log.e(TAG, "Failed to send heartbeat, will retry");
            return Result.retry();
        }
    }
}
