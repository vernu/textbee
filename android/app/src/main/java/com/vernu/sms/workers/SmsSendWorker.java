package com.vernu.sms.workers;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.Worker;
import androidx.work.WorkManager;
import androidx.work.WorkerParameters;

import com.vernu.sms.AppConstants;
import com.vernu.sms.TextBeeUtils;
import com.vernu.sms.helpers.SMSHelper;
import com.vernu.sms.helpers.SharedPreferenceHelper;

public class SmsSendWorker extends Worker {
    private static final String TAG = "SmsSendWorker";
    private static final String QUEUE_NAME = "sms_send_queue";

    public static final String KEY_PHONE = "phone";
    public static final String KEY_MESSAGE = "message";
    public static final String KEY_SMS_ID = "sms_id";
    public static final String KEY_SMS_BATCH_ID = "sms_batch_id";
    public static final String KEY_SIM_SUBSCRIPTION_ID = "sim_subscription_id";

    public SmsSendWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        String phone = getInputData().getString(KEY_PHONE);
        String message = getInputData().getString(KEY_MESSAGE);
        String smsId = getInputData().getString(KEY_SMS_ID);
        String smsBatchId = getInputData().getString(KEY_SMS_BATCH_ID);
        int simSubscriptionId = getInputData().getInt(KEY_SIM_SUBSCRIPTION_ID, -1);

        if (phone == null || message == null || smsId == null) {
            Log.e(TAG, "Missing required parameters");
            return Result.failure();
        }

        Context context = getApplicationContext();

        // Resolve SIM: backend-provided > app preference > device default
        Integer resolvedSim = resolveSim(context, simSubscriptionId);

        if (resolvedSim != null) {
            SMSHelper.sendSMSFromSpecificSim(phone, message, resolvedSim, smsId, smsBatchId, context);
        } else {
            SMSHelper.sendSMS(phone, message, smsId, smsBatchId, context);
        }

        // Enforce rate limit delay
        int delaySeconds = SharedPreferenceHelper.getSharedPreferenceInt(
                context, AppConstants.SHARED_PREFS_SMS_SEND_DELAY_SECONDS_KEY, AppConstants.DEFAULT_SMS_SEND_DELAY_SECONDS);
        delaySeconds = Math.max(0, Math.min(delaySeconds, 3600));

        if (delaySeconds > 0) {
            try {
                Thread.sleep(delaySeconds * 1000L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        return Result.success();
    }

    private Integer resolveSim(Context context, int backendSimId) {
        // Priority 1: backend-provided SIM
        if (backendSimId != -1 && TextBeeUtils.isValidSubscriptionId(context, backendSimId)) {
            Log.d(TAG, "Using backend-provided SIM subscription ID: " + backendSimId);
            return backendSimId;
        }

        // Priority 2: app preference
        int preferredSim = SharedPreferenceHelper.getSharedPreferenceInt(
                context, AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY, -1);
        if (preferredSim != -1 && TextBeeUtils.isValidSubscriptionId(context, preferredSim)) {
            Log.d(TAG, "Using app-preferred SIM subscription ID: " + preferredSim);
            return preferredSim;
        }

        // Priority 3: device default
        return null;
    }

    public static void enqueue(Context context, String phone, String message,
                               String smsId, String smsBatchId, Integer simSubscriptionId) {
        Data inputData = new Data.Builder()
                .putString(KEY_PHONE, phone)
                .putString(KEY_MESSAGE, message)
                .putString(KEY_SMS_ID, smsId)
                .putString(KEY_SMS_BATCH_ID, smsBatchId)
                .putInt(KEY_SIM_SUBSCRIPTION_ID, simSubscriptionId != null ? simSubscriptionId : -1)
                .build();

        OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(SmsSendWorker.class)
                .setInputData(inputData)
                .build();

        WorkManager.getInstance(context)
                .beginUniqueWork(QUEUE_NAME, ExistingWorkPolicy.APPEND_OR_REPLACE, workRequest)
                .enqueue();

        Log.d(TAG, "SMS enqueued for sending - ID: " + smsId + ", Phone: " + phone);
    }
}
