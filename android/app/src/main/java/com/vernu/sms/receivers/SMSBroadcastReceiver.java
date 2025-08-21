package com.vernu.sms.receivers;

import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.workers.SMSReceivedWorker;

import java.util.Objects;


public class SMSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "********** SMSBroadcastReceiver START **********");
        try {
            Log.d(TAG, "Intent Action: " + intent.getAction());

            if (!Objects.equals(intent.getAction(), Telephony.Sms.Intents.SMS_DELIVER_ACTION)) {
                Log.d(TAG, "Not SMS_DELIVER_ACTION intent, ignoring.");
                return;
            }

            SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            if (messages == null || messages.length == 0) {
                Log.d(TAG, "No messages found in intent.");
                return;
            }
            Log.d(TAG, "Found " + messages.length + " message parts.");

            String deviceId = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
            String apiKey = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_API_KEY_KEY, "");
            boolean receiveSMSEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(context, AppConstants.SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY, false);

            Log.d(TAG, "Device ID: " + deviceId);
            Log.d(TAG, "API Key: " + apiKey);
            Log.d(TAG, "Receive SMS Enabled: " + receiveSMSEnabled);

            if (deviceId.isEmpty() || apiKey.isEmpty() || !receiveSMSEnabled) {
                Log.d(TAG, "Device ID or API Key is empty or Receive SMS Feature is disabled. Aborting.");
                return;
            }

            SMSDTO receivedSMSDTO = new SMSDTO();
            receivedSMSDTO.setMessage("");

            StringBuilder messageBody = new StringBuilder();
            String originatingAddress = null;
            long timestampMillis = 0;

            for (SmsMessage message : messages) {
                messageBody.append(message.getMessageBody());
                if (originatingAddress == null) {
                    originatingAddress = message.getOriginatingAddress();
                }
                if (timestampMillis == 0) {
                    timestampMillis = message.getTimestampMillis();
                }
            }

            receivedSMSDTO.setMessage(messageBody.toString());
            receivedSMSDTO.setSender(originatingAddress);
            receivedSMSDTO.setReceivedAtInMillis(timestampMillis);

            Log.d(TAG, "Assembled SMS DTO: " + receivedSMSDTO.toString());

            ContentValues values = new ContentValues();
            values.put(Telephony.Sms.ADDRESS, receivedSMSDTO.getSender());
            values.put(Telephony.Sms.BODY, receivedSMSDTO.getMessage());
            values.put(Telephony.Sms.DATE, receivedSMSDTO.getReceivedAtInMillis());

            Log.d(TAG, "Inserting SMS into Inbox...");
            context.getContentResolver().insert(Telephony.Sms.Inbox.CONTENT_URI, values);
            Log.d(TAG, "SMS inserted into Inbox.");

            Log.d(TAG, "Enqueuing SMSReceivedWorker...");
            SMSReceivedWorker.enqueueWork(context, deviceId, apiKey, receivedSMSDTO);
            Log.d(TAG, "SMSReceivedWorker enqueued.");

        } catch (Exception e) {
            Log.e(TAG, "An error occurred in SMSBroadcastReceiver", e);
        } finally {
            Log.d(TAG, "********** SMSBroadcastReceiver END **********");
        }
    }
}