package com.vernu.sms.ui.onboarding

import android.content.Context
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.messaging.FirebaseMessaging
import com.vernu.sms.ApiManagerKt
import com.vernu.sms.AppConstants
import com.vernu.sms.BuildConfig
import com.vernu.sms.TextBeeUtils
import com.vernu.sms.dtos.RegisterDeviceInputDTO
import com.vernu.sms.dtos.SimInfoCollectionDTO
import com.vernu.sms.helpers.HeartbeatManager
import com.vernu.sms.helpers.SharedPreferenceHelper
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

data class OnboardingState(
    val apiKey: String = "",
    val deviceId: String = "",
    val deviceName: String = "${Build.BRAND} ${Build.MODEL}",
    val isReturningUser: Boolean = false,
    val useExistingDeviceId: Boolean = false,
    val isQrScanned: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val registeredDeviceId: String? = null,
    val registeredDeviceName: String? = null
)

class OnboardingViewModel : ViewModel() {

    private val _state = MutableStateFlow(OnboardingState())
    val state: StateFlow<OnboardingState> = _state.asStateFlow()

    private val _registrationSuccess = Channel<Unit>(Channel.CONFLATED)
    val registrationSuccess = _registrationSuccess.receiveAsFlow()

    fun setApiKey(key: String) {
        _state.update { it.copy(apiKey = key.trim(), errorMessage = null, isQrScanned = false) }
    }

    fun onQrScanned(key: String) {
        _state.update { it.copy(apiKey = key.trim(), errorMessage = null, isQrScanned = true) }
    }

    fun setDeviceId(id: String) {
        _state.update { it.copy(deviceId = id.trim(), errorMessage = null) }
    }

    fun setDeviceName(name: String) {
        _state.update { it.copy(deviceName = name) }
    }

    fun setReturningUser(returning: Boolean) {
        _state.update { it.copy(isReturningUser = returning, useExistingDeviceId = returning) }
    }

    fun setUseExistingDeviceId(use: Boolean) {
        _state.update { it.copy(useExistingDeviceId = use, deviceId = if (!use) "" else it.deviceId) }
    }

    fun clearError() {
        _state.update { it.copy(errorMessage = null) }
    }

    fun registerOrUpdateDevice(context: Context) {
        val current = _state.value
        val apiKey = current.apiKey
        val deviceId = current.deviceId
        val shouldUpdate = current.isReturningUser || (current.useExistingDeviceId && deviceId.isNotEmpty())

        if (apiKey.isEmpty()) {
            _state.update { it.copy(errorMessage = "Please enter your API key.") }
            return
        }
        if ((current.isReturningUser || current.useExistingDeviceId) && deviceId.isEmpty()) {
            _state.update { it.copy(errorMessage = "Please enter your Device ID.") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val fcmToken = getFcmToken()
                val simInfo = SimInfoCollectionDTO().apply {
                    setLastUpdated(System.currentTimeMillis())
                    setSims(TextBeeUtils.collectSimInfo(context))
                }
                val input = RegisterDeviceInputDTO().apply {
                    setFcmToken(fcmToken)
                    setBrand(Build.BRAND)
                    setManufacturer(Build.MANUFACTURER)
                    setModel(Build.MODEL)
                    setBuildId(Build.ID)
                    setOs(Build.VERSION.BASE_OS)
                    setAppVersionCode(BuildConfig.VERSION_CODE)
                    setAppVersionName(BuildConfig.VERSION_NAME)
                    setName(current.deviceName.ifEmpty { "${Build.BRAND} ${Build.MODEL}" })
                    setSimInfo(simInfo)
                }

                val response = if (shouldUpdate) {
                    ApiManagerKt.getApiService().updateDevice(deviceId, apiKey, input)
                } else {
                    ApiManagerKt.getApiService().registerDevice(apiKey, input)
                }

                if (response.isSuccessful) {
                    val data = response.body()?.data
                        ?: throw IllegalStateException("missing_response")
                    val registeredId = data["_id"] as? String
                        ?: throw IllegalStateException("missing_id")
                    val heartbeatInterval = (data["heartbeatIntervalMinutes"] as? Double)?.toInt() ?: 30
                    val name = data["name"] as? String ?: ""

                    SharedPreferenceHelper.setSharedPreferenceString(
                        context, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, registeredId
                    )
                    SharedPreferenceHelper.setSharedPreferenceString(
                        context, AppConstants.SHARED_PREFS_API_KEY_KEY, apiKey
                    )
                    SharedPreferenceHelper.setSharedPreferenceInt(
                        context, AppConstants.SHARED_PREFS_HEARTBEAT_INTERVAL_MINUTES_KEY, heartbeatInterval
                    )
                    val resolvedName = name.ifEmpty { current.deviceName }
                    SharedPreferenceHelper.setSharedPreferenceString(
                        context, AppConstants.SHARED_PREFS_DEVICE_NAME_KEY, resolvedName
                    )
                    HeartbeatManager.scheduleHeartbeat(context)

                    _state.update {
                        it.copy(
                            isLoading = false,
                            registeredDeviceId = registeredId,
                            registeredDeviceName = resolvedName
                        )
                    }
                    _registrationSuccess.send(Unit)
                } else {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = when (response.code()) {
                                401 -> "Invalid API key. Go back and check your key."
                                404 -> "Device ID not found. Verify it in your dashboard."
                                in 500..599 -> "Server error. Please try again in a moment."
                                else -> "Request failed (${response.code()}). Please try again."
                            }
                        )
                    }
                }
            } catch (e: Exception) {
                val message = when {
                    e.message == "missing_id" -> "Unexpected server response. Please try again."
                    e.message?.contains("Unable to resolve host") == true ||
                    e.message?.contains("timeout") == true ||
                    e.message?.contains("connect") == true ->
                        "No internet connection. Check your network and retry."
                    else -> "Something went wrong. Please try again."
                }
                _state.update { it.copy(isLoading = false, errorMessage = message) }
                TextBeeUtils.logException(e, "Onboarding device registration failed")
            }
        }
    }

    private suspend fun getFcmToken(): String = suspendCoroutine { cont ->
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token -> cont.resume(token) }
            .addOnFailureListener { e -> cont.resumeWithException(e) }
    }
}
