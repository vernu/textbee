package com.vernu.sms.receivers;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.util.Log;

import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.workers.SMSStatusUpdateWorker;


public class SMSStatusReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSStatusReceiver";
    
    public static final String SMS_SENT = "SMS_SENT";
    public static final String SMS_DELIVERED = "SMS_DELIVERED";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String smsId = intent.getStringExtra("sms_id");
        String smsBatchId = intent.getStringExtra("sms_batch_id");
        String action = intent.getAction();
        
        SMSDTO smsDTO = new SMSDTO();
        smsDTO.setSmsId(smsId);
        smsDTO.setSmsBatchId(smsBatchId);
        
        if (SMS_SENT.equals(action)) {
            handleSentStatus(context, getResultCode(), smsDTO);
        } else if (SMS_DELIVERED.equals(action)) {
            handleDeliveredStatus(context, getResultCode(), smsDTO);
        }
    }
    
    private void handleSentStatus(Context context, int resultCode, SMSDTO smsDTO) {
        long timestamp = System.currentTimeMillis();
        String errorMessage = "";
        
        switch (resultCode) {
            case Activity.RESULT_OK:
                smsDTO.setStatus("SENT");
                smsDTO.setSentAtInMillis(timestamp);
                Log.d(TAG, "SMS sent successfully - ID: " + smsDTO.getSmsId());
                break;
            case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
                errorMessage = "Generic failure";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_RADIO_OFF:
                errorMessage = "Radio off";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_NULL_PDU:
                errorMessage = "Null PDU";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_NO_SERVICE:
                errorMessage = "No service";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_LIMIT_EXCEEDED:
                errorMessage = "Sending limit exceeded";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_SHORT_CODE_NOT_ALLOWED:
                errorMessage = "Short code not allowed";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_SHORT_CODE_NEVER_ALLOWED:
                errorMessage = "Short code never allowed";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            default:
                errorMessage = "Unknown error";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Unknown error code: " + resultCode);
                break;
        }
        
        updateSMSStatus(context, smsDTO);
    }
    
    private void handleDeliveredStatus(Context context, int resultCode, SMSDTO smsDTO) {
        long timestamp = System.currentTimeMillis();
        String errorMessage = "";
        
        switch (resultCode) {
            case Activity.RESULT_OK:
                smsDTO.setStatus("DELIVERED");
                smsDTO.setDeliveredAtInMillis(timestamp);
                Log.d(TAG, "SMS delivered successfully - ID: " + smsDTO.getSmsId());
                break;
            case Activity.RESULT_CANCELED:
                errorMessage = "Delivery canceled";
                smsDTO.setStatus("DELIVERY_FAILED");
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS delivery failed - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            default:
                errorMessage = "Unknown delivery error";
                smsDTO.setStatus("DELIVERY_FAILED");
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS delivery failed - ID: " + smsDTO.getSmsId() + ", Unknown error code: " + resultCode);
                break;
        }
        
        updateSMSStatus(context, smsDTO);
    }
    
    private void updateSMSStatus(Context context, SMSDTO smsDTO) {
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_API_KEY_KEY, "");
        
        if (deviceId.isEmpty() || apiKey.isEmpty()) {
            Log.e(TAG, "Device ID or API key not found");
            return;
        }

        SMSStatusUpdateWorker.enqueueWork(context, deviceId, apiKey, smsDTO);
    }
} 