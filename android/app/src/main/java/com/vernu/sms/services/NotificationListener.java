package com.vernu.sms.services;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
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
                    // If sender is not a phone number (i.e., it's a contact name), try to resolve it to a phone number
                    String actualPhoneNumber = resolveToPhoneNumber(sender, messageBody);
                    if (actualPhoneNumber != null) {
                        sender = actualPhoneNumber;
                    }

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

    private String resolveToPhoneNumber(String potentialContactName, String messageBody) {
        // If the sender is already a phone number, return null (no resolution needed)
        if (isPhoneNumber(potentialContactName)) {
            return null;
        }

        Log.d(TAG, "Attempting to resolve contact name '" + potentialContactName + "' to phone number");

        // Search recent SMS messages to find a phone number that matches this contact or message
        Uri smsUri = Telephony.Sms.CONTENT_URI;
        String[] projection = {
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE
        };

        // Look for recent messages with similar content or from the same timeframe
        Cursor cursor = getContentResolver().query(
            smsUri,
            projection,
            Telephony.Sms.TYPE + " = ? AND " + Telephony.Sms.DATE + " > ?",
            new String[]{
                String.valueOf(Telephony.Sms.MESSAGE_TYPE_INBOX),
                String.valueOf(System.currentTimeMillis() - 30000) // Last 30 seconds
            },
            Telephony.Sms.DATE + " DESC LIMIT 5"
        );

        if (cursor != null) {
            try {
                while (cursor.moveToNext()) {
                    String address = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY));

                    // If we find a message with matching content and a phone number address
                    if (body != null && messageBody != null &&
                        body.trim().equals(messageBody.trim()) &&
                        isPhoneNumber(address)) {

                        Log.d(TAG, "Resolved contact name '" + potentialContactName + "' to phone number: " + address);
                        return address;
                    }
                }
            } finally {
                cursor.close();
            }
        }

        Log.d(TAG, "Could not resolve contact name '" + potentialContactName + "' to phone number, using original name");
        return null;
    }

    private boolean isPhoneNumber(String input) {
        if (input == null) return false;

        // Remove all non-digit characters except + and count digits
        String digitsOnly = input.replaceAll("[^+0-9]", "");
        String numbersOnly = digitsOnly.replaceAll("[^0-9]", "");

        // A phone number should have at least 10 digits
        return numbersOnly.length() >= 10 &&
               (digitsOnly.startsWith("+") || digitsOnly.matches("[0-9]+"));
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed for our use case
    }
}