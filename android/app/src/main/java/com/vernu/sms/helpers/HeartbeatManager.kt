package com.vernu.sms.helpers

import android.content.Context
import android.util.Log
import androidx.work.*
import com.vernu.sms.AppConstants
import com.vernu.sms.workers.HeartbeatWorker
import java.util.concurrent.TimeUnit

object HeartbeatManager {
    private const val TAG = "HeartbeatManager"
    private const val MIN_INTERVAL_MINUTES = 15
    private const val UNIQUE_WORK_NAME = "heartbeat_unique_work"

    @JvmStatic
    fun scheduleHeartbeat(context: Context) {
        val appContext = context.applicationContext
        var intervalMinutes = SharedPreferenceHelper.getSharedPreferenceInt(
            appContext, AppConstants.SHARED_PREFS_HEARTBEAT_INTERVAL_MINUTES_KEY, 30
        )
        if (intervalMinutes < MIN_INTERVAL_MINUTES) {
            Log.w(TAG, "Interval $intervalMinutes minutes is less than minimum $MIN_INTERVAL_MINUTES minutes, using minimum")
            intervalMinutes = MIN_INTERVAL_MINUTES
        }
        Log.d(TAG, "Scheduling heartbeat with interval: $intervalMinutes minutes")

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val heartbeatWork = PeriodicWorkRequest.Builder(
            HeartbeatWorker::class.java,
            intervalMinutes.toLong(),
            TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .addTag(AppConstants.HEARTBEAT_WORK_TAG)
            .build()

        WorkManager.getInstance(appContext)
            .enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.REPLACE,
                heartbeatWork
            )
        Log.d(TAG, "Heartbeat scheduled successfully with unique work name: $UNIQUE_WORK_NAME")
    }

    @JvmStatic
    fun cancelHeartbeat(context: Context) {
        Log.d(TAG, "Cancelling heartbeat work")
        val appContext = context.applicationContext
        WorkManager.getInstance(appContext).cancelUniqueWork(UNIQUE_WORK_NAME)
        WorkManager.getInstance(appContext).cancelAllWorkByTag(AppConstants.HEARTBEAT_WORK_TAG)
    }

    @JvmStatic
    fun triggerHeartbeat(context: Context) {
        Log.d(TAG, "Triggering immediate heartbeat")
        scheduleHeartbeat(context)
    }
}
