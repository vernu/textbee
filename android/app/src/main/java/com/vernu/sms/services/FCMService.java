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

public class FCMService extends FirebaseMessagingService {

    private static final String TAG = "FirebaseMessagingService";
    private static final String DEFAULT_NOTIFICATION_CHANNEL_ID = "N1";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {

        Log.d(TAG, remoteMessage.getData().toString());

        Gson gson = new Gson();
        SMSPayload smsPayload = gson.fromJson(remoteMessage.getData().get("smsData"), SMSPayload.class);

        // Check if message contains a data payload.
        if (remoteMessage.getData().size() > 0) {
            int preferedSim = SharedPreferenceHelper.getSharedPreferenceInt(this, AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY, -1);
            for (String receiver : smsPayload.getRecipients()) {
                if(preferedSim == -1) {
                    SMSHelper.sendSMS(receiver, smsPayload.getMessage());
                    continue;
                }
                try {
                    SMSHelper.sendSMSFromSpecificSim(receiver, smsPayload.getMessage(), preferedSim);
                } catch(Exception e) {
                    Log.d("SMS_SEND_ERROR", e.getMessage());
                }
            }
        }

        // TODO: Handle FCM Notification Messages
        if (remoteMessage.getNotification() != null) {
            // sendNotification("notif msg", "msg body");
        }

    }

    @Override
    public void onNewToken(String token) {
        sendRegistrationToServer(token);
    }

    private void sendRegistrationToServer(String token) {

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