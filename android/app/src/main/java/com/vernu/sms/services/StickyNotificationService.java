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

public class StickyNotificationService extends Service {

    private static final String TAG = "StickyNotificationService";
    private final BroadcastReceiver receiver = new SMSBroadcastReceiver();

    @Override
    public IBinder onBind(Intent intent) {
        Log.i(TAG, "Service onBind " + intent.getAction());
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Service Started");


//        IntentFilter filter = new IntentFilter();
//        filter.addAction(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
//        filter.addAction(android.telephony.TelephonyManager.ACTION_PHONE_STATE_CHANGED);
//        registerReceiver(receiver, filter);
//
//        Notification notification = createNotification();
//        startForeground(1, notification);

    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Received start id " + startId + ": " + intent);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
//        unregisterReceiver(receiver);
        Log.i(TAG, "StickyNotificationService destroyed");
//        Toast.makeText(this, "Service destroyed", Toast.LENGTH_SHORT).show();
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
            return builder.setContentTitle("TextBee is running").setContentText("TextBee is running in the background.").setContentIntent(pendingIntent).setOngoing(true).setSmallIcon(R.drawable.ic_launcher_foreground).build();
        } else {
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, notificationChannelId);
            return builder.setContentTitle("TextBee is running").setContentText("TextBee is running in the background.").setOngoing(true).setSmallIcon(R.drawable.ic_launcher_foreground).build();
        }

    }
}