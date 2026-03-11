package com.vernu.sms.receivers;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.util.Log;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.workers.SMSStatusUpdateWorker;


public class SMSStatusReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSStatusReceiver";
    
    public static final String SMS_SENT = "SMS_SENT";
    public static final String SMS_DELIVERED = "SMS_DELIVERED";
    
    /**
     * Resolves a result code to the constant name (e.g. SmsManager.RESULT_ERROR_GENERIC_FAILURE)
     * via reflection. Returns null if no matching constant is found.
     */
    private static String getResultCodeName(int resultCode) {
        for (Class<?> clazz : new Class<?>[]{ SmsManager.class, Activity.class }) {
            try {
                for (Field field : clazz.getDeclaredFields()) {
                    if (field.getType() != int.class) continue;
                    if (!Modifier.isStatic(field.getModifiers()) || !Modifier.isFinal(field.getModifiers())) continue;
                    if (!field.getName().startsWith("RESULT_")) continue;
                    field.setAccessible(true);
                    if (field.getInt(null) == resultCode) {
                        return clazz.getSimpleName() + "." + field.getName();
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Reflection failed for " + clazz.getSimpleName() + ": " + e.getMessage());
            }
        }
        return null;
    }
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String smsId = intent.getStringExtra("sms_id");
        String smsBatchId = intent.getStringExtra("sms_batch_id");
        String action = intent.getAction();
        
        SMSDTO smsDTO = new SMSDTO();
        smsDTO.setSmsId(smsId);
        smsDTO.setSmsBatchId(smsBatchId);
        
        if (SMS_SENT.equals(action)) {
            handleSentStatus(context, intent, getResultCode(), smsDTO);
        } else if (SMS_DELIVERED.equals(action)) {
            handleDeliveredStatus(context, getResultCode(), smsDTO);
        }
    }
    
    private void handleSentStatus(Context context, Intent intent, int resultCode, SMSDTO smsDTO) {
        long timestamp = System.currentTimeMillis();
        String errorMessage = "";
        
        switch (resultCode) {
            case Activity.RESULT_OK:
                smsDTO.setStatus("SENT");
                smsDTO.setSentAtInMillis(timestamp);
                Log.d(TAG, "SMS sent successfully - ID: " + smsDTO.getSmsId());
                break;
            case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
                errorMessage = "SMS failed on device. Common causes: no SMS credit on SIM, weak signal, or carrier blocked. Check SIM balance and signal, then try again.";
                int radioCode = intent.getIntExtra("errorCode", -1);
                if (radioCode != -1) {
                    errorMessage += " (code " + radioCode + ")";
                }
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_RADIO_OFF:
                errorMessage = "Mobile radio is off (e.g. airplane mode). Turn off airplane mode and ensure cellular is on.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_NULL_PDU:
                errorMessage = "Message could not be sent; invalid format or carrier issue. Try a shorter message or different recipient.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_NO_SERVICE:
                errorMessage = "No cellular service. Check signal and try again when you have coverage.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_LIMIT_EXCEEDED:
                errorMessage = "Device/carrier send limit reached (too many SMS in a short time). Wait a few minutes or lower the send rate.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_SHORT_CODE_NOT_ALLOWED:
                errorMessage = "Short code not allowed on this carrier. Use a full phone number.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_ERROR_SHORT_CODE_NEVER_ALLOWED:
                errorMessage = "Short codes are not supported on this carrier. Use a full phone number.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            case SmsManager.RESULT_NETWORK_ERROR:
                errorMessage = "Network error while sending. Check signal and try again.";
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            default:
                String codeName = getResultCodeName(resultCode);
                errorMessage = codeName != null ? codeName : ("Unknown error (code " + resultCode + ")");
                smsDTO.setStatus("FAILED");
                smsDTO.setFailedAtInMillis(timestamp);
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS failed to send - ID: " + smsDTO.getSmsId() + ", Error: " + errorMessage);
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
                errorMessage = "Delivery report was canceled (e.g. carrier does not support delivery receipts). Message may still have been delivered.";
                smsDTO.setStatus("DELIVERY_FAILED");
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS delivery failed - ID: " + smsDTO.getSmsId() + ", Error code: " + resultCode + ", Error: " + errorMessage);
                break;
            default:
                String deliveryCodeName = getResultCodeName(resultCode);
                errorMessage = deliveryCodeName != null ? deliveryCodeName : ("Unknown delivery error (code " + resultCode + ")");
                smsDTO.setStatus("DELIVERY_FAILED");
                smsDTO.setErrorCode(String.valueOf(resultCode));
                smsDTO.setErrorMessage(errorMessage);
                Log.e(TAG, "SMS delivery failed - ID: " + smsDTO.getSmsId() + ", Error: " + errorMessage);
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