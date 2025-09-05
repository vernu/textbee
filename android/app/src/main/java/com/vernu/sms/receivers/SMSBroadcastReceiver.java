package com.vernu.sms.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import android.widget.Toast;
import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.workers.SMSReceivedWorker;

import java.util.Objects;


public class SMSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "onReceive: " + intent.getAction());
        Toast.makeText(context, "SMS Broadcast Receiver Triggered!", Toast.LENGTH_SHORT).show();

        if (!Objects.equals(intent.getAction(), Telephony.Sms.Intents.SMS_RECEIVED_ACTION)) {
            Log.d(TAG, "Not Valid intent");
            Toast.makeText(context, "Not a valid SMS intent", Toast.LENGTH_SHORT).show();
            return;
        }

        SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
        if (messages == null) {
            Log.d(TAG, "No messages found");
            return;
        }

        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_API_KEY_KEY, "");
        boolean receiveSMSEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(context, AppConstants.SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY, false);

        if (deviceId.isEmpty() || apiKey.isEmpty() || !receiveSMSEnabled) {
            Log.d(TAG, "Device ID or API Key is empty or Receive SMS Feature is disabled");
            Toast.makeText(context, "SMS Gateway not configured properly", Toast.LENGTH_SHORT).show();
            return;
        }

//        SMS receivedSMS = new SMS();
//        receivedSMS.setType("RECEIVED");
//        for (SmsMessage message : messages) {
//            receivedSMS.setMessage(receivedSMS.getMessage() + message.getMessageBody());
//            receivedSMS.setSender(message.getOriginatingAddress());
//            receivedSMS.setReceivedAt(new Date(message.getTimestampMillis()));
//        }

        SMSDTO receivedSMSDTO = new SMSDTO();

        for (SmsMessage message : messages) {
            receivedSMSDTO.setMessage(receivedSMSDTO.getMessage() + message.getMessageBody());
            receivedSMSDTO.setSender(message.getOriginatingAddress());
            receivedSMSDTO.setReceivedAtInMillis(message.getTimestampMillis());
        }
//        receivedSMSDTO.setSender(receivedSMS.getSender());
//        receivedSMSDTO.setMessage(receivedSMS.getMessage());
//        receivedSMSDTO.setReceivedAt(receivedSMS.getReceivedAt());

        Toast.makeText(context, "SMS received from " + receivedSMSDTO.getSender() + " - forwarding to server", Toast.LENGTH_LONG).show();
        SMSReceivedWorker.enqueueWork(context, deviceId, apiKey, receivedSMSDTO);
    }

//    private void updateLocalReceivedSMS(SMS localReceivedSMS, Context context) {
//        Executors.newSingleThreadExecutor().execute(() -> {
//            AppDatabase appDatabase = AppDatabase.getInstance(context);
//            appDatabase.localReceivedSMSDao().insertAll(localReceivedSMS);
//        });
//    }
}