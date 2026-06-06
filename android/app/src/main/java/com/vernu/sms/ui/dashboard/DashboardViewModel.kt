package com.vernu.sms.ui.dashboard

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.vernu.sms.ApiManagerKt
import com.vernu.sms.AppConstants
import com.vernu.sms.TextBeeUtils
import com.vernu.sms.dtos.RegisterDeviceInputDTO
import com.vernu.sms.dtos.SubscriptionResponse
import com.vernu.sms.dtos.UserProfile
import com.vernu.sms.helpers.HeartbeatManager
import com.vernu.sms.helpers.SharedPreferenceHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class GatewayStats(
    val totalSentSMS: Int?,
    val totalReceivedSMS: Int?,
    val totalDevices: Int?,
    val totalApiKeys: Int?
)

data class DashboardState(
    val deviceName: String = "",
    val deviceId: String = "",
    val isGatewayEnabled: Boolean = false,
    val lastHeartbeatMs: Long? = null,
    val stats: GatewayStats? = null,
    val isStatsLoading: Boolean = true,
    val statsUnavailable: Boolean = false,
    val isTogglingGateway: Boolean = false,
    val subscription: SubscriptionResponse? = null,
    val isSubscriptionLoading: Boolean = true,
    val subscriptionUnavailable: Boolean = false,
    val userProfile: UserProfile? = null
)

class DashboardViewModel(app: Application) : AndroidViewModel(app) {

    private val context get() = getApplication<Application>().applicationContext

    private val _state = MutableStateFlow(DashboardState())
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    init {
        loadLocalState()
        fetchStats()
        fetchSubscription()
        fetchUserProfile()
    }

    fun refresh() {
        loadLocalState()
        fetchStats()
        fetchSubscription()
        fetchUserProfile()
    }

    private fun loadLocalState() {
        val deviceName = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_DEVICE_NAME_KEY, ""
        ) ?: ""
        val deviceId = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, ""
        ) ?: ""
        val isEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
            context, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, false
        )
        val lastHeartbeatStr = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_LAST_HEARTBEAT_MS_KEY, ""
        )
        val lastHeartbeatMs = lastHeartbeatStr?.toLongOrNull()

        _state.update {
            it.copy(
                deviceName = deviceName,
                deviceId = deviceId,
                isGatewayEnabled = isEnabled,
                lastHeartbeatMs = lastHeartbeatMs
            )
        }
    }

    private fun fetchStats() {
        val apiKey = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_API_KEY_KEY, ""
        ) ?: ""
        if (apiKey.isEmpty()) {
            _state.update { it.copy(isStatsLoading = false, statsUnavailable = true) }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isStatsLoading = true, statsUnavailable = false) }
            try {
                val response = ApiManagerKt.getApiService().getStats(apiKey)
                if (response.isSuccessful) {
                    val data = response.body()?.data
                    _state.update {
                        it.copy(
                            isStatsLoading = false,
                            statsUnavailable = data == null,
                            stats = data?.let { d ->
                                GatewayStats(
                                    totalSentSMS = d.totalSentSMSCount,
                                    totalReceivedSMS = d.totalReceivedSMSCount,
                                    totalDevices = d.totalDeviceCount,
                                    totalApiKeys = d.totalApiKeyCount
                                )
                            }
                        )
                    }
                } else {
                    _state.update { it.copy(isStatsLoading = false, statsUnavailable = true) }
                }
            } catch (e: Exception) {
                _state.update { it.copy(isStatsLoading = false, statsUnavailable = true) }
                TextBeeUtils.logException(e, "Dashboard stats fetch failed")
            }
        }
    }

    private fun fetchUserProfile() {
        val apiKey = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_API_KEY_KEY, ""
        ) ?: ""
        if (apiKey.isEmpty()) return
        viewModelScope.launch {
            try {
                val response = ApiManagerKt.getApiService().whoAmI(apiKey)
                if (response.isSuccessful) {
                    _state.update { it.copy(userProfile = response.body()?.data) }
                }
            } catch (e: Exception) {
                TextBeeUtils.logException(e, "User profile fetch failed")
            }
        }
    }

    private fun fetchSubscription() {
        val apiKey = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_API_KEY_KEY, ""
        ) ?: ""
        if (apiKey.isEmpty()) {
            _state.update { it.copy(isSubscriptionLoading = false, subscriptionUnavailable = true) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isSubscriptionLoading = true, subscriptionUnavailable = false) }
            try {
                val response = ApiManagerKt.getApiService().getCurrentSubscription(apiKey)
                if (response.isSuccessful) {
                    _state.update { it.copy(isSubscriptionLoading = false, subscription = response.body()) }
                } else {
                    _state.update { it.copy(isSubscriptionLoading = false, subscriptionUnavailable = true) }
                }
            } catch (e: Exception) {
                _state.update { it.copy(isSubscriptionLoading = false, subscriptionUnavailable = true) }
                TextBeeUtils.logException(e, "Subscription fetch failed")
            }
        }
    }

    fun toggleGateway(enabled: Boolean) {
        val deviceId = _state.value.deviceId
        val apiKey = SharedPreferenceHelper.getSharedPreferenceString(
            context, AppConstants.SHARED_PREFS_API_KEY_KEY, ""
        ) ?: ""
        if (deviceId.isEmpty() || apiKey.isEmpty()) return

        viewModelScope.launch {
            _state.update { it.copy(isTogglingGateway = true) }
            try {
                val input = RegisterDeviceInputDTO().apply { setEnabled(enabled) }
                val response = ApiManagerKt.getApiService().updateDevice(deviceId, apiKey, input)
                if (response.isSuccessful) {
                    SharedPreferenceHelper.setSharedPreferenceBoolean(
                        context, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, enabled
                    )
                    _state.update { it.copy(isGatewayEnabled = enabled) }
                    try {
                        if (enabled) {
                            if (SharedPreferenceHelper.getSharedPreferenceBoolean(
                                    context, AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY, false
                                )
                            ) {
                                TextBeeUtils.startStickyNotificationService(context)
                            }
                            HeartbeatManager.scheduleHeartbeat(context)
                        } else {
                            TextBeeUtils.stopStickyNotificationService(context)
                            HeartbeatManager.cancelHeartbeat(context)
                        }
                    } catch (e: Exception) {
                        TextBeeUtils.logException(e, "Gateway service toggle failed")
                    }
                }
            } catch (e: Exception) {
                TextBeeUtils.logException(e, "Gateway toggle failed")
            } finally {
                _state.update { it.copy(isTogglingGateway = false) }
            }
        }
    }
}
