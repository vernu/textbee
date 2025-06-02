package com.vernu.sms.services;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.google.gson.Gson;
import com.vernu.sms.AppConstants;
import com.vernu.sms.R;
import com.vernu.sms.activities.MainActivity;
import com.vernu.sms.helpers.SMSHelper;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.models.SMSPayload;
import com.vernu.sms.dtos.RegisterDeviceInputDTO;
import com.vernu.sms.dtos.RegisterDeviceResponseDTO;
import com.vernu.sms.ApiManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class FCMService extends FirebaseMessagingService {

    private static final String TAG = "FirebaseMessagingService";
    private static final String DEFAULT_NOTIFICATION_CHANNEL_ID = "N1";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, remoteMessage.getData().toString());

        try {
            // Parse SMS payload data
            Gson gson = new Gson();
            SMSPayload smsPayload = gson.fromJson(remoteMessage.getData().get("smsData"), SMSPayload.class);

            // Check if message contains a data payload
            if (remoteMessage.getData().size() > 0) {
                sendSMS(smsPayload);
            }

            // Handle any notification message
            if (remoteMessage.getNotification() != null) {
                // sendNotification("notif msg", "msg body");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing FCM message: " + e.getMessage());
        }
    }

    /**
     * Send SMS to recipients using the provided payload
     */
    private void sendSMS(SMSPayload smsPayload) {
        if (smsPayload == null) {
            Log.e(TAG, "SMS payload is null");
            return;
        }

        // Get preferred SIM
        int preferredSim = SharedPreferenceHelper.getSharedPreferenceInt(
                this, AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY, -1);
        
        // Check if SMS payload contains valid recipients
        String[] recipients = smsPayload.getRecipients();
        if (recipients == null || recipients.length == 0) {
            Log.e(TAG, "No recipients found in SMS payload");
            return;
        }
        
        // Send SMS to each recipient
        boolean atLeastOneSent = false;
        int sentCount = 0;
        int failedCount = 0;
        
        for (String recipient : recipients) {
            boolean smsSent;
            
            // Try to send using default or specific SIM based on preference
            if (preferredSim == -1) {
                // Use default SIM
                smsSent = SMSHelper.sendSMS(
                    recipient, 
                    smsPayload.getMessage(), 
                    smsPayload.getSmsId(), 
                    smsPayload.getSmsBatchId(), 
                    this
                );
            } else {
                // Use specific SIM
                try {
                    smsSent = SMSHelper.sendSMSFromSpecificSim(
                        recipient, 
                        smsPayload.getMessage(), 
                        preferredSim, 
                        smsPayload.getSmsId(), 
                        smsPayload.getSmsBatchId(), 
                        this
                    );
                } catch (Exception e) {
                    Log.e(TAG, "Error sending SMS from specific SIM: " + e.getMessage());
                    smsSent = false;
                }
            }
            
            // Track sent and failed counts
            if (smsSent) {
                sentCount++;
                atLeastOneSent = true;
            } else {
                failedCount++;
            }
        }
        
        // Log summary
        Log.d(TAG, "SMS sending complete - Batch: " + smsPayload.getSmsBatchId() + 
              ", Sent: " + sentCount + ", Failed: " + failedCount);
    }

    @Override
    public void onNewToken(String token) {
        sendRegistrationToServer(token);
    }

    private void sendRegistrationToServer(String token) {
        // Check if device ID and API key are saved in shared preferences
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(this, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(this, AppConstants.SHARED_PREFS_API_KEY_KEY, "");
        
        // Only proceed if both device ID and API key are available
        if (deviceId.isEmpty() || apiKey.isEmpty()) {
            Log.d(TAG, "Device ID or API key not available, skipping FCM token update");
            return;
        }
        
        // Create update payload with new FCM token
        RegisterDeviceInputDTO updateInput = new RegisterDeviceInputDTO();
        updateInput.setFcmToken(token);
        
        // Call API to update the device with new token
        Log.d(TAG, "Updating FCM token for device: " + deviceId);
        ApiManager.getApiService()
            .updateDevice(deviceId, apiKey, updateInput)
            .enqueue(new Callback<RegisterDeviceResponseDTO>() {
                @Override
                public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "FCM token updated successfully");
                    } else {
                        Log.e(TAG, "Failed to update FCM token. Response code: " + response.code());
                    }
                }
                
                @Override
                public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                    Log.e(TAG, "Error updating FCM token: " + t.getMessage());
                }
            });
    }

    /* build and show notification */
    private void sendNotification(String title, String messageBody) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 /* Request code */, intent,
                PendingIntent.FLAG_ONE_SHOT);

        String channelId = DEFAULT_NOTIFICATION_CHANNEL_ID;
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, DEFAULT_NOTIFICATION_CHANNEL_ID)
                        .setSmallIcon(R.drawable.ic_launcher_foreground)
                        .setContentTitle(title)
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setContentIntent(pendingIntent);

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Since android Oreo notification channel is needed.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId,
                    "Channel human readable title",
                    NotificationManager.IMPORTANCE_DEFAULT);
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify(0 /* ID of notification */, notificationBuilder.build());
    }
}