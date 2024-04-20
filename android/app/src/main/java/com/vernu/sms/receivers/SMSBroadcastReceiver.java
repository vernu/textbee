package com.vernu.sms.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import com.vernu.sms.ApiManager;
import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.dtos.SMSForwardResponseDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;

import java.util.Date;
import java.util.Objects;

import retrofit2.Call;
import retrofit2.Response;

public class SMSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "onReceive: " + intent.getAction());

        if (!Objects.equals(intent.getAction(), Telephony.Sms.Intents.SMS_RECEIVED_ACTION)) {
            Log.d(TAG, "Not Valid intent");
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
            receivedSMSDTO.setReceivedAt(new Date(message.getTimestampMillis()));
        }
//        receivedSMSDTO.setSender(receivedSMS.getSender());
//        receivedSMSDTO.setMessage(receivedSMS.getMessage());
//        receivedSMSDTO.setReceivedAt(receivedSMS.getReceivedAt());

        Call<SMSForwardResponseDTO> apiCall = ApiManager.getApiService().sendReceivedSMS(deviceId, apiKey, receivedSMSDTO);
        apiCall.enqueue(new retrofit2.Callback<SMSForwardResponseDTO>() {
            @Override
            public void onResponse(Call<SMSForwardResponseDTO> call, Response<SMSForwardResponseDTO> response) {
//                Date now = new Date();
                if (response.isSuccessful()) {
                    Log.d(TAG, "SMS sent to server successfully");
//                    receivedSMS.setLastAcknowledgedRequestAt(now);
//                    receivedSMS.setServerAcknowledgedAt(now);
//                    updateLocalReceivedSMS(receivedSMS, context);
                } else {
                    Log.e(TAG, "Failed to send SMS to server");
//                    receivedSMS.setServerAcknowledgedAt(null);
//                    receivedSMS.setLastAcknowledgedRequestAt(now);
//                    receivedSMS.setRetryCount(localReceivedSMS.getRetryCount() + 1);
//                    updateLocalReceivedSMS(receivedSMS, context);
                }
            }
            @Override
            public void onFailure(Call<SMSForwardResponseDTO> call, Throwable t) {
                Log.e(TAG, "Failed to send SMS to server", t);
//                receivedSMS.setServerAcknowledgedAt(null);
//                receivedSMS.setLastAcknowledgedRequestAt(new Date());
//                updateLocalReceivedSMS(receivedSMS, context);
            }
        });
    }

//    private void updateLocalReceivedSMS(SMS localReceivedSMS, Context context) {
//        Executors.newSingleThreadExecutor().execute(() -> {
//            AppDatabase appDatabase = AppDatabase.getInstance(context);
//            appDatabase.localReceivedSMSDao().insertAll(localReceivedSMS);
//        });
//    }
}