package com.vernu.sms;

import android.app.Application;

import androidx.work.Configuration;
import androidx.work.WorkManager;

public class SMSGatewayApplication extends Application implements Configuration.Provider {
    @Override
    public void onCreate() {
        super.onCreate();
    }
    
    @Override
    public Configuration getWorkManagerConfiguration() {
        return new Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build();
    }
} 