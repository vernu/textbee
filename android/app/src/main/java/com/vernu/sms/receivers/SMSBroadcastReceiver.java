package com.vernu.sms.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import com.vernu.sms.AppConstants;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.workers.SMSReceivedWorker;

import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


public class SMSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSBroadcastReceiver";
    // In-memory cache to prevent rapid duplicate processing (5 seconds TTL)
    private static final ConcurrentHashMap<String, Long> processedFingerprints = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5000; // 5 seconds

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
            receivedSMSDTO.setReceivedAtInMillis(message.getTimestampMillis());
        }
//        receivedSMSDTO.setSender(receivedSMS.getSender());
//        receivedSMSDTO.setMessage(receivedSMS.getMessage());
//        receivedSMSDTO.setReceivedAt(receivedSMS.getReceivedAt());

        // Generate fingerprint for deduplication
        String fingerprint = generateFingerprint(
            receivedSMSDTO.getSender(),
            receivedSMSDTO.getMessage(),
            receivedSMSDTO.getReceivedAtInMillis()
        );
        receivedSMSDTO.setFingerprint(fingerprint);

        // Check in-memory cache to prevent rapid duplicate processing
        long currentTime = System.currentTimeMillis();
        Long lastProcessedTime = processedFingerprints.get(fingerprint);
        
        if (lastProcessedTime != null && (currentTime - lastProcessedTime) < CACHE_TTL_MS) {
            Log.d(TAG, "Duplicate SMS detected in cache, skipping: " + fingerprint);
            return;
        }

        // Update cache
        processedFingerprints.put(fingerprint, currentTime);
        
        // Clean up old cache entries periodically
        cleanupCache(currentTime);

        SMSReceivedWorker.enqueueWork(context, deviceId, apiKey, receivedSMSDTO);
    }

//    private void updateLocalReceivedSMS(SMS localReceivedSMS, Context context) {
//        Executors.newSingleThreadExecutor().execute(() -> {
//            AppDatabase appDatabase = AppDatabase.getInstance(context);
//            appDatabase.localReceivedSMSDao().insertAll(localReceivedSMS);
//        });
//    }

    /**
     * Generate a unique fingerprint for an SMS message based on sender, message content, and timestamp
     */
    private String generateFingerprint(String sender, String message, long timestamp) {
        try {
            String data = (sender != null ? sender : "") + "|" + 
                         (message != null ? message : "") + "|" + 
                         timestamp;
            
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(data.getBytes("UTF-8"));
            
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error generating fingerprint: " + e.getMessage());
            // Fallback to simple string concatenation if MD5 fails
            return (sender != null ? sender : "") + "_" + 
                   (message != null ? message : "") + "_" + 
                   timestamp;
        }
    }

    /**
     * Clean up old cache entries to prevent memory leaks
     */
    private void cleanupCache(long currentTime) {
        // Only cleanup occasionally (every 100 entries processed)
        if (processedFingerprints.size() > 100) {
            Set<String> keysToRemove = new HashSet<>();
            for (String key : processedFingerprints.keySet()) {
                Long timestamp = processedFingerprints.get(key);
                if (timestamp != null && (currentTime - timestamp) > CACHE_TTL_MS) {
                    keysToRemove.add(key);
                }
            }
            for (String key : keysToRemove) {
                processedFingerprints.remove(key);
            }
            Log.d(TAG, "Cleaned up " + keysToRemove.size() + " expired cache entries");
        }
    }
}