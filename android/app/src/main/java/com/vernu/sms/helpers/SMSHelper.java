package com.vernu.sms.helpers;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.os.Build;
import android.telephony.SubscriptionManager;
import android.util.Log;

import com.vernu.sms.ApiManager;
import com.vernu.sms.AppConstants;
import com.vernu.sms.TextBeeUtils;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.dtos.SMSForwardResponseDTO;
import com.vernu.sms.receivers.SMSStatusReceiver;
import com.vernu.sms.services.GatewayApiService;

import java.util.ArrayList;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SMSHelper {
    private static final String TAG = "SMSHelper";
    
    /**
     * Sends an SMS message and returns whether the operation was successful
     * 
     * @param phoneNo The recipient's phone number
     * @param message The SMS message to send
     * @param smsId The unique ID for this SMS
     * @param smsBatchId The batch ID for this SMS
     * @param context The application context
     * @return boolean True if sending was initiated, false if permissions aren't granted
     */
    public static boolean sendSMS(String phoneNo, String message, String smsId, String smsBatchId, Context context) {
        // Check if we have permission to send SMS
        if (!TextBeeUtils.isPermissionGranted(context, Manifest.permission.SEND_SMS)) {
            Log.e(TAG, "SMS permission not granted. Unable to send SMS.");
            
            // Report failure to API
            reportPermissionError(context, smsId, smsBatchId);
            
            return false;
        }
        
        try {
            SmsManager smsManager = SmsManager.getDefault();

            // Create pending intents for status tracking
            PendingIntent sentIntent = createSentPendingIntent(context, smsId, smsBatchId);
            PendingIntent deliveredIntent = createDeliveredPendingIntent(context, smsId, smsBatchId);

            // For SMS with more than 160 chars
            ArrayList<String> parts = smsManager.divideMessage(message);
            if (parts.size() > 1) {
                ArrayList<PendingIntent> sentIntents = new ArrayList<>();
                ArrayList<PendingIntent> deliveredIntents = new ArrayList<>();
                
                for (int i = 0; i < parts.size(); i++) {
                    sentIntents.add(sentIntent);
                    deliveredIntents.add(deliveredIntent);
                }
                
                smsManager.sendMultipartTextMessage(phoneNo, null, parts, sentIntents, deliveredIntents);
            } else {
                smsManager.sendTextMessage(phoneNo, null, message, sentIntent, deliveredIntent);
            }
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Exception when sending SMS: " + e.getMessage());
            
            // Report exception to API
            reportSendingError(context, smsId, smsBatchId, e.getMessage());
            
            return false;
        }
    }
    
    /**
     * Sends an SMS message from a specific SIM slot and returns whether the operation was successful
     * 
     * @param phoneNo The recipient's phone number
     * @param message The SMS message to send
     * @param simSubscriptionId The specific SIM subscription ID to use
     * @param smsId The unique ID for this SMS
     * @param smsBatchId The batch ID for this SMS
     * @param context The application context
     * @return boolean True if sending was initiated, false if permissions aren't granted
     */
    public static boolean sendSMSFromSpecificSim(String phoneNo, String message, int simSubscriptionId, 
                                      String smsId, String smsBatchId, Context context) {
        // Check for required permissions
        if (!TextBeeUtils.isPermissionGranted(context, Manifest.permission.SEND_SMS) ||
            !TextBeeUtils.isPermissionGranted(context, Manifest.permission.READ_PHONE_STATE)) {
            Log.e(TAG, "SMS or Phone State permission not granted. Unable to send SMS from specific SIM.");
            
            // Report failure to API
            reportPermissionError(context, smsId, smsBatchId);
            
            return false;
        }
        
        try {
            // Get the SmsManager for the specific SIM
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                smsManager = SmsManager.getSmsManagerForSubscriptionId(simSubscriptionId);
            } else {
                // Fallback to default SmsManager for older Android versions
                smsManager = SmsManager.getDefault();
                Log.w(TAG, "Using default SIM as specific SIM selection not supported on this Android version");
            }

            // Create pending intents for status tracking
            PendingIntent sentIntent = createSentPendingIntent(context, smsId, smsBatchId);
            PendingIntent deliveredIntent = createDeliveredPendingIntent(context, smsId, smsBatchId);

            // For SMS with more than 160 chars
            ArrayList<String> parts = smsManager.divideMessage(message);
            if (parts.size() > 1) {
                ArrayList<PendingIntent> sentIntents = new ArrayList<>();
                ArrayList<PendingIntent> deliveredIntents = new ArrayList<>();
                
                for (int i = 0; i < parts.size(); i++) {
                    sentIntents.add(sentIntent);
                    deliveredIntents.add(deliveredIntent);
                }
                
                smsManager.sendMultipartTextMessage(phoneNo, null, parts, sentIntents, deliveredIntents);
            } else {
                smsManager.sendTextMessage(phoneNo, null, message, sentIntent, deliveredIntent);
            }
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Exception when sending SMS from specific SIM: " + e.getMessage());
            
            // Report exception to API
            reportSendingError(context, smsId, smsBatchId, e.getMessage());
            
            return false;
        }
    }
    
    private static void reportPermissionError(Context context, String smsId, String smsBatchId) {
        SMSDTO smsDTO = new SMSDTO();
        smsDTO.setSmsId(smsId);
        smsDTO.setSmsBatchId(smsBatchId);
        smsDTO.setStatus("FAILED");
        smsDTO.setFailedAtInMillis(System.currentTimeMillis());
        smsDTO.setErrorCode("PERMISSION_DENIED");
        smsDTO.setErrorMessage("SMS permission not granted");
        
        updateSMSStatus(context, smsDTO);
    }
    
    private static void reportSendingError(Context context, String smsId, String smsBatchId, String errorMessage) {
        SMSDTO smsDTO = new SMSDTO();
        smsDTO.setSmsId(smsId);
        smsDTO.setSmsBatchId(smsBatchId);
        smsDTO.setStatus("FAILED");
        smsDTO.setFailedAtInMillis(System.currentTimeMillis());
        smsDTO.setErrorCode("SENDING_EXCEPTION");
        smsDTO.setErrorMessage(errorMessage);
        
        updateSMSStatus(context, smsDTO);
    }
    
    private static void updateSMSStatus(Context context, SMSDTO smsDTO) {
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(context, AppConstants.SHARED_PREFS_API_KEY_KEY, "");
        
        if (deviceId.isEmpty() || apiKey.isEmpty()) {
            Log.e(TAG, "Device ID or API key not found");
            return;
        }
        
        GatewayApiService apiService = ApiManager.getApiService();
        Call<SMSForwardResponseDTO> call = apiService.updateSMSStatus(deviceId, apiKey, smsDTO);
        
        call.enqueue(new Callback<SMSForwardResponseDTO>() {
            @Override
            public void onResponse(Call<SMSForwardResponseDTO> call, Response<SMSForwardResponseDTO> response) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "SMS status updated successfully - ID: " + smsDTO.getSmsId() + ", Status: " + smsDTO.getStatus());
                } else {
                    Log.e(TAG, "Failed to update SMS status. Response code: " + response.code());
                }
            }
            
            @Override
            public void onFailure(Call<SMSForwardResponseDTO> call, Throwable t) {
                Log.e(TAG, "API call failed: " + t.getMessage());
            }
        });
    }
    
    private static PendingIntent createSentPendingIntent(Context context, String smsId, String smsBatchId) {
        // Create explicit intent (specify the component)
        Intent intent = new Intent(context, SMSStatusReceiver.class);
        intent.setAction(SMSStatusReceiver.SMS_SENT);
        intent.putExtra("sms_id", smsId);
        intent.putExtra("sms_batch_id", smsBatchId);
        
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        
        // Use a unique request code to avoid PendingIntent collisions
        int requestCode = (smsId + "_sent").hashCode();
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }
    
    private static PendingIntent createDeliveredPendingIntent(Context context, String smsId, String smsBatchId) {
        // Create explicit intent (specify the component)
        Intent intent = new Intent(context, SMSStatusReceiver.class);
        intent.setAction(SMSStatusReceiver.SMS_DELIVERED);
        intent.putExtra("sms_id", smsId);
        intent.putExtra("sms_batch_id", smsBatchId);
        
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        
        // Use a unique request code to avoid PendingIntent collisions
        int requestCode = (smsId + "_delivered").hashCode();
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }
}
