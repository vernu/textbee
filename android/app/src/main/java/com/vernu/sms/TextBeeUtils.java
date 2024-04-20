package com.vernu.sms;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.vernu.sms.services.StickyNotificationService;

import java.util.ArrayList;
import java.util.List;

public class TextBeeUtils {
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

        Intent notificationIntent = new Intent(context, StickyNotificationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(notificationIntent);
        } else {
            context.startService(notificationIntent);
        }
    }

    public static void stopStickyNotificationService(Context context) {
        Intent notificationIntent = new Intent(context, StickyNotificationService.class);
        context.stopService(notificationIntent);
    }
}
