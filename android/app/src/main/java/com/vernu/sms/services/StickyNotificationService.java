package com.vernu.sms.services;

import android.app.*;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.IBinder;
import android.provider.Telephony;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import com.vernu.sms.R;
import com.vernu.sms.activities.MainActivity;
import com.vernu.sms.receivers.SMSBroadcastReceiver;
import com.vernu.sms.AppConstants;
import com.vernu.sms.helpers.SharedPreferenceHelper;

public class StickyNotificationService extends Service {

    private static final String TAG = "StickyNotificationService";

    @Override
    public IBinder onBind(Intent intent) {
        Log.i(TAG, "Service onBind " + intent.getAction());
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Service Started");

        // Only show notification if enabled in preferences
        boolean stickyNotificationEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                getApplicationContext(),
                AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY,
                false
        );

        if (stickyNotificationEnabled) {
            Notification notification = createNotification();
            startForeground(1, notification);
            Log.i(TAG, "Started foreground service with sticky notification");
        } else {
            Log.i(TAG, "Sticky notification disabled by user preference");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Received start id " + startId + ": " + intent);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        
        Log.i(TAG, "StickyNotificationService destroyed");
    }

    private Notification createNotification() {
        String notificationChannelId = "stickyNotificationChannel";

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = null;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            channel = new NotificationChannel(notificationChannelId, notificationChannelId, NotificationManager.IMPORTANCE_HIGH);
            channel.enableVibration(false);
            channel.setShowBadge(false);
            notificationManager.createNotificationChannel(channel);

            Intent notificationIntent = new Intent(this, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

            Notification.Builder builder = new Notification.Builder(this, notificationChannelId);
            return builder.setContentTitle("TextBee Active")
                    .setContentText("SMS gateway service is active")
                    .setContentIntent(pendingIntent)
                    .setOngoing(true)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .build();
        } else {
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, notificationChannelId);
            return builder.setContentTitle("TextBee Active")
                    .setContentText("SMS gateway service is active")
                    .setOngoing(true)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .build();
        }

    }
}