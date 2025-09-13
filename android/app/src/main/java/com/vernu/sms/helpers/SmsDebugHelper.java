package com.vernu.sms.helpers;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
import android.util.Log;

public class SmsDebugHelper {
    private static final String TAG = "SmsDebugHelper";

    public static void logRecentMessages(Context context, int limit) {
        Log.d(TAG, "=== SMS DATABASE DEBUG ===");

        Uri smsUri = Telephony.Sms.CONTENT_URI;
        String[] projection = {
            Telephony.Sms._ID,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE,
            Telephony.Sms.TYPE,
            Telephony.Sms.PROTOCOL,
            Telephony.Sms.THREAD_ID
        };

        Cursor cursor = context.getContentResolver().query(
            smsUri,
            projection,
            null,
            null,
            Telephony.Sms.DATE + " DESC LIMIT " + limit
        );

        if (cursor != null) {
            try {
                Log.d(TAG, "Found " + cursor.getCount() + " messages in database");

                while (cursor.moveToNext()) {
                    String messageId = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms._ID));
                    String address = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY));
                    long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE));
                    int type = cursor.getInt(cursor.getColumnIndexOrThrow(Telephony.Sms.TYPE));
                    String protocol = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.PROTOCOL));
                    long threadId = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.THREAD_ID));

                    String typeStr = getMessageTypeString(type);
                    String bodyPreview = body != null ? body.substring(0, Math.min(30, body.length())) : "null";

                    Log.d(TAG, String.format("MSG[%s]: From=%s, Type=%s(%d), Protocol=%s, Thread=%d, Body=%s...",
                        messageId, address, typeStr, type, protocol, threadId, bodyPreview));
                }
            } finally {
                cursor.close();
            }
        }

        Log.d(TAG, "=== END SMS DATABASE DEBUG ===");
    }

    private static String getMessageTypeString(int type) {
        switch (type) {
            case Telephony.Sms.MESSAGE_TYPE_INBOX: return "INBOX";
            case Telephony.Sms.MESSAGE_TYPE_SENT: return "SENT";
            case Telephony.Sms.MESSAGE_TYPE_DRAFT: return "DRAFT";
            case Telephony.Sms.MESSAGE_TYPE_OUTBOX: return "OUTBOX";
            case Telephony.Sms.MESSAGE_TYPE_FAILED: return "FAILED";
            case Telephony.Sms.MESSAGE_TYPE_QUEUED: return "QUEUED";
            default: return "UNKNOWN(" + type + ")";
        }
    }

    public static void logMmsMessages(Context context, int limit) {
        Log.d(TAG, "=== MMS DATABASE DEBUG ===");

        try {
            Uri mmsUri = Telephony.Mms.CONTENT_URI;
            String[] projection = {
                Telephony.Mms._ID,
                Telephony.Mms.THREAD_ID,
                Telephony.Mms.DATE,
                Telephony.Mms.MESSAGE_BOX,
                Telephony.Mms.CONTENT_TYPE
            };

            Cursor cursor = context.getContentResolver().query(
                mmsUri,
                projection,
                null,
                null,
                Telephony.Mms.DATE + " DESC LIMIT " + limit
            );

            if (cursor != null) {
                try {
                    Log.d(TAG, "Found " + cursor.getCount() + " MMS messages in database");

                    while (cursor.moveToNext()) {
                        String messageId = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Mms._ID));
                        long threadId = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Mms.THREAD_ID));
                        long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Mms.DATE));
                        int messageBox = cursor.getInt(cursor.getColumnIndexOrThrow(Telephony.Mms.MESSAGE_BOX));
                        String contentType = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Mms.CONTENT_TYPE));

                        Log.d(TAG, String.format("MMS[%s]: Thread=%d, Box=%d, ContentType=%s",
                            messageId, threadId, messageBox, contentType));
                    }
                } finally {
                    cursor.close();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error reading MMS database", e);
        }

        Log.d(TAG, "=== END MMS DATABASE DEBUG ===");
    }
}