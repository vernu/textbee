package com.vernu.sms.workers;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.os.StatFs;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.firebase.messaging.FirebaseMessaging;
import com.vernu.sms.ApiManager;
import com.vernu.sms.AppConstants;
import com.vernu.sms.BuildConfig;
import com.vernu.sms.dtos.HeartbeatInputDTO;
import com.vernu.sms.dtos.HeartbeatResponseDTO;
import com.vernu.sms.dtos.SimInfoCollectionDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.TextBeeUtils;

import java.io.File;
import java.io.IOException;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import retrofit2.Call;
import retrofit2.Response;

public class HeartbeatWorker extends Worker {
    private static final String TAG = "HeartbeatWorker";

    public HeartbeatWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();

        // Check if device is registered
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(
            context,
            AppConstants.SHARED_PREFS_DEVICE_ID_KEY,
            ""
        );

        if (deviceId.isEmpty()) {
            Log.d(TAG, "Device not registered, skipping heartbeat");
            return Result.success(); // Not a failure, just skip
        }

        // Check if device is enabled
        boolean deviceEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
            context,
            AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY,
            false
        );

        if (!deviceEnabled) {
            Log.d(TAG, "Device not enabled, skipping heartbeat");
            return Result.success(); // Not a failure, just skip
        }

        // Check if heartbeat feature is enabled
        boolean heartbeatEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
            context,
            AppConstants.SHARED_PREFS_HEARTBEAT_ENABLED_KEY,
            true // Default to true
        );

        if (!heartbeatEnabled) {
            Log.d(TAG, "Heartbeat feature disabled, skipping heartbeat");
            return Result.success(); // Not a failure, just skip
        }

        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(
            context,
            AppConstants.SHARED_PREFS_API_KEY_KEY,
            ""
        );

        if (apiKey.isEmpty()) {
            Log.e(TAG, "API key not available, skipping heartbeat");
            return Result.success(); // Not a failure, just skip
        }

        // Collect device information
        HeartbeatInputDTO heartbeatInput = new HeartbeatInputDTO();

        try {
            // Get FCM token (blocking wait)
            try {
                CountDownLatch latch = new CountDownLatch(1);
                final String[] fcmToken = new String[1];
                FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        fcmToken[0] = task.getResult();
                    }
                    latch.countDown();
                });
                if (latch.await(5, TimeUnit.SECONDS) && fcmToken[0] != null) {
                    heartbeatInput.setFcmToken(fcmToken[0]);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to get FCM token: " + e.getMessage());
                // Continue without FCM token
            }

            // Get battery information
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = context.registerReceiver(null, ifilter);
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int batteryPct = (int) ((level / (float) scale) * 100);
                heartbeatInput.setBatteryPercentage(batteryPct);

                int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL;
                heartbeatInput.setIsCharging(isCharging);
            }

            // Get network type
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
                if (activeNetwork != null && activeNetwork.isConnected()) {
                    if (activeNetwork.getType() == ConnectivityManager.TYPE_WIFI) {
                        heartbeatInput.setNetworkType("wifi");
                    } else if (activeNetwork.getType() == ConnectivityManager.TYPE_MOBILE) {
                        heartbeatInput.setNetworkType("cellular");
                    } else {
                        heartbeatInput.setNetworkType("none");
                    }
                } else {
                    heartbeatInput.setNetworkType("none");
                }
            }

            // Get app version
            heartbeatInput.setAppVersionName(BuildConfig.VERSION_NAME);
            heartbeatInput.setAppVersionCode(BuildConfig.VERSION_CODE);

            // Get device uptime
            heartbeatInput.setDeviceUptimeMillis(SystemClock.uptimeMillis());

            // Get memory information
            Runtime runtime = Runtime.getRuntime();
            heartbeatInput.setMemoryFreeBytes(runtime.freeMemory());
            heartbeatInput.setMemoryTotalBytes(runtime.totalMemory());
            heartbeatInput.setMemoryMaxBytes(runtime.maxMemory());

            // Get storage information
            File internalStorage = context.getFilesDir();
            StatFs statFs = new StatFs(internalStorage.getPath());
            long availableBytes = statFs.getAvailableBytes();
            long totalBytes = statFs.getTotalBytes();
            heartbeatInput.setStorageAvailableBytes(availableBytes);
            heartbeatInput.setStorageTotalBytes(totalBytes);

            // Get system information
            heartbeatInput.setTimezone(TimeZone.getDefault().getID());
            heartbeatInput.setLocale(Locale.getDefault().toString());

            // Get receive SMS enabled status
            boolean receiveSMSEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                context,
                AppConstants.SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY,
                false
            );
            heartbeatInput.setReceiveSMSEnabled(receiveSMSEnabled);

            // Collect SIM information
            SimInfoCollectionDTO simInfoCollection = new SimInfoCollectionDTO();
            simInfoCollection.setLastUpdated(System.currentTimeMillis());
            simInfoCollection.setSims(TextBeeUtils.collectSimInfo(context));
            heartbeatInput.setSimInfo(simInfoCollection);

            // Send heartbeat request
            Call<HeartbeatResponseDTO> call = ApiManager.getApiService().heartbeat(deviceId, apiKey, heartbeatInput);
            Response<HeartbeatResponseDTO> response = call.execute();

            if (response.isSuccessful() && response.body() != null) {
                HeartbeatResponseDTO responseBody = response.body();
                if (responseBody.fcmTokenUpdated) {
                    Log.d(TAG, "FCM token was updated during heartbeat");
                }
                Log.d(TAG, "Heartbeat sent successfully");
                return Result.success();
            } else {
                Log.e(TAG, "Failed to send heartbeat. Response code: " + (response.code()));
                return Result.retry();
            }
        } catch (IOException e) {
            Log.e(TAG, "Heartbeat API call failed: " + e.getMessage());
            return Result.retry();
        } catch (Exception e) {
            Log.e(TAG, "Error collecting device information: " + e.getMessage());
            return Result.retry();
        }
    }
}
