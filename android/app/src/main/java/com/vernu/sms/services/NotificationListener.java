package com.vernu.sms.services;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.workers.SMSReceivedWorker;

public class NotificationListener extends NotificationListenerService {
    private static final String TAG = "NotificationListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            // Check if this is a messaging notification
            if (isMessagingNotification(sbn)) {
                handleMessagingNotification(sbn);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling notification", e);
        }
    }

    private boolean isMessagingNotification(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Notification notification = sbn.getNotification();

        // Check for common messaging apps
        boolean isMessagingApp = packageName.contains("messages") ||
                                packageName.contains("sms") ||
                                packageName.contains("messaging") ||
                                packageName.equals("com.google.android.apps.messaging") ||
                                packageName.equals("com.samsung.android.messaging") ||
                                packageName.contains("android.mms");

        // Check if it's a message-type notification
        boolean isMessageNotification = notification.category != null &&
                                       notification.category.equals(Notification.CATEGORY_MESSAGE);

        Log.d(TAG, "Notification from " + packageName + ", isMessagingApp: " + isMessagingApp + ", isMessageNotification: " + isMessageNotification);

        return isMessagingApp || isMessageNotification;
    }

    private void handleMessagingNotification(StatusBarNotification sbn) {
        // Check if feature is enabled
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(this, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(this, AppConstants.SHARED_PREFS_API_KEY_KEY, "");
        boolean receiveSMSEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(this, AppConstants.SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY, false);

        if (deviceId.isEmpty() || apiKey.isEmpty() || !receiveSMSEnabled) {
            Log.d(TAG, "SMS Gateway not configured properly");
            return;
        }

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        if (extras != null) {
            String title = extras.getString(Notification.EXTRA_TITLE);
            String text = extras.getString(Notification.EXTRA_TEXT);
            String bigText = extras.getString(Notification.EXTRA_BIG_TEXT);

            // Use big text if available, otherwise use regular text
            String messageBody = bigText != null ? bigText : text;

            Log.d(TAG, "Notification Details - Title: " + title + ", Text: " + text + ", BigText: " + bigText + ", Package: " + sbn.getPackageName());

            if (title != null && messageBody != null && !messageBody.isEmpty()) {
                // Try to extract phone number from title (common in messaging apps)
                String sender = extractPhoneNumber(title);

                if (sender != null) {
                    Log.d(TAG, "Processing notification message from " + sender);

                    SMSDTO receivedSMSDTO = new SMSDTO();
                    receivedSMSDTO.setMessage(messageBody);
                    receivedSMSDTO.setSender(sender);
                    receivedSMSDTO.setReceivedAtInMillis(System.currentTimeMillis());

                    Toast.makeText(this, "Message notification from " + sender + " - forwarding to server", Toast.LENGTH_LONG).show();
                    SMSReceivedWorker.enqueueWork(this, deviceId, apiKey, receivedSMSDTO);
                }
            }
        }
    }

    private String extractPhoneNumber(String title) {
        if (title == null) return null;

        // Try to find phone number patterns
        String phoneRegex = ".*([+]?1?[0-9]{10,15}).*";
        if (title.matches(phoneRegex)) {
            // Extract the number
            String cleaned = title.replaceAll("[^+0-9]", "");
            if (cleaned.length() >= 10) {
                return cleaned;
            }
        }

        // If no phone number found, use the title as sender name
        return title;
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed for our use case
    }
}