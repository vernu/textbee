package com.vernu.sms.receivers;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessaging;
import com.vernu.sms.ApiManager;
import com.vernu.sms.AppConstants;
import com.vernu.sms.BuildConfig;
import com.vernu.sms.TextBeeUtils;
import com.vernu.sms.dtos.RegisterDeviceInputDTO;
import com.vernu.sms.dtos.RegisterDeviceResponseDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.helpers.HeartbeatManager;
import com.vernu.sms.services.StickyNotificationService;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BootCompletedReceiver extends BroadcastReceiver {
    private static final String TAG = "BootCompletedReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            boolean stickyNotificationEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                context,
                AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY,
                false
            );
            
            if(stickyNotificationEnabled && TextBeeUtils.isPermissionGranted(context, Manifest.permission.RECEIVE_SMS)){
                Log.i(TAG, "Device booted, starting sticky notification service");
                TextBeeUtils.startStickyNotificationService(context);
            }
            
            // Report device info to server if device is registered
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
            
            // Only proceed if both device ID and API key are available
            if (!deviceId.isEmpty() && !apiKey.isEmpty()) {
                updateDeviceInfo(context, deviceId, apiKey);
                
                // Schedule heartbeat if device is enabled
                boolean deviceEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                    context,
                    AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY,
                    false
                );
                if (deviceEnabled) {
                    Log.i(TAG, "Device booted, scheduling heartbeat");
                    HeartbeatManager.scheduleHeartbeat(context);
                }
            }
        }
    }
    
    /**
     * Updates device information on the server after boot
     */
    private void updateDeviceInfo(Context context, String deviceId, String apiKey) {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.e(TAG, "Failed to obtain FCM token after boot");
                    return;
                }
                
                String token = task.getResult();
                
                RegisterDeviceInputDTO updateInput = new RegisterDeviceInputDTO();
                updateInput.setFcmToken(token);
                updateInput.setAppVersionCode(BuildConfig.VERSION_CODE);
                updateInput.setAppVersionName(BuildConfig.VERSION_NAME);
                
                Log.d(TAG, "Updating device info after boot - deviceId: " + deviceId);
                
                ApiManager.getApiService()
                    .updateDevice(deviceId, apiKey, updateInput)
                    .enqueue(new Callback<RegisterDeviceResponseDTO>() {
                        @Override
                        public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {
                            if (response.isSuccessful()) {
                                Log.d(TAG, "Device info updated successfully after boot");
                                
                                // Sync heartbeatIntervalMinutes from server response
                                if (response.body() != null && response.body().data != null) {
                                    if (response.body().data.get("heartbeatIntervalMinutes") != null) {
                                        Object intervalObj = response.body().data.get("heartbeatIntervalMinutes");
                                        if (intervalObj instanceof Number) {
                                            int intervalMinutes = ((Number) intervalObj).intValue();
                                            SharedPreferenceHelper.setSharedPreferenceInt(context, AppConstants.SHARED_PREFS_HEARTBEAT_INTERVAL_MINUTES_KEY, intervalMinutes);
                                            Log.d(TAG, "Synced heartbeat interval from server: " + intervalMinutes + " minutes");
                                        }
                                    }
                                }
                            } else {
                                Log.e(TAG, "Failed to update device info after boot. Response code: " + response.code());
                            }
                        }
                        
                        @Override
                        public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                            Log.e(TAG, "Error updating device info after boot: " + t.getMessage());
                        }
                    });
            });
    }
}
