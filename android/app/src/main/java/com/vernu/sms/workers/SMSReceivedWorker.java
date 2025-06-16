package com.vernu.sms.workers;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import com.google.gson.Gson;
import com.vernu.sms.ApiManager;
import com.vernu.sms.dtos.SMSDTO;
import com.vernu.sms.dtos.SMSForwardResponseDTO;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import retrofit2.Call;
import retrofit2.Response;

public class SMSReceivedWorker extends Worker {
    private static final String TAG = "SMSReceivedWorker";
    private static final int MAX_RETRIES = 5;
    
    public static final String KEY_DEVICE_ID = "device_id";
    public static final String KEY_API_KEY = "api_key";
    public static final String KEY_SMS_DTO = "sms_dto";
    public static final String KEY_RETRY_COUNT = "retry_count";
    
    public SMSReceivedWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }
    
    @NonNull
    @Override
    public Result doWork() {
        String deviceId = getInputData().getString(KEY_DEVICE_ID);
        String apiKey = getInputData().getString(KEY_API_KEY);
        String smsDtoJson = getInputData().getString(KEY_SMS_DTO);
        int retryCount = getInputData().getInt(KEY_RETRY_COUNT, 0);
        
        if (deviceId == null || apiKey == null || smsDtoJson == null) {
            Log.e(TAG, "Missing required parameters");
            return Result.failure();
        }
        
        // Check if we've exceeded the maximum retry count
        if (retryCount >= MAX_RETRIES) {
            Log.e(TAG, "Maximum retry count reached for received SMS");
            return Result.failure();
        }
        
        SMSDTO smsDTO = new Gson().fromJson(smsDtoJson, SMSDTO.class);
        
        try {
            Call<SMSForwardResponseDTO> call = ApiManager.getApiService().sendReceivedSMS(deviceId, apiKey, smsDTO);
            Response<SMSForwardResponseDTO> response = call.execute();
            
            if (response.isSuccessful()) {
                Log.d(TAG, "Received SMS sent to server successfully");
                return Result.success();
            } else {
                Log.e(TAG, "Failed to send received SMS to server. Response code: " + response.code());
                return Result.retry();
            }
        } catch (IOException e) {
            Log.e(TAG, "API call failed: " + e.getMessage());
            return Result.retry();
        }
    }
    
    public static void enqueueWork(Context context, String deviceId, String apiKey, SMSDTO smsDTO) {
        Data inputData = new Data.Builder()
                .putString(KEY_DEVICE_ID, deviceId)
                .putString(KEY_API_KEY, apiKey)
                .putString(KEY_SMS_DTO, new Gson().toJson(smsDTO))
                .putInt(KEY_RETRY_COUNT, 0)
                .build();
        
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();
        
        OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(SMSReceivedWorker.class)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
                .setInputData(inputData)
                .addTag("sms_received")
                .build();
        
        String uniqueWorkName = "sms_received_" + System.currentTimeMillis();
        WorkManager.getInstance(context)
                .beginUniqueWork(uniqueWorkName, 
                        androidx.work.ExistingWorkPolicy.APPEND_OR_REPLACE, 
                        workRequest)
                .enqueue();
        
        Log.d(TAG, "Work enqueued for received SMS from: " + smsDTO.getSender());
    }
} 