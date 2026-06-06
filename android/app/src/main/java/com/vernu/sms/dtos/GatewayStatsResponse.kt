package com.vernu.sms.dtos

import com.google.gson.annotations.SerializedName

data class GatewayStatsResponse(
    @SerializedName("data") val data: GatewayStatsData? = null
)

data class GatewayStatsData(
    @SerializedName("totalSentSMSCount") val totalSentSMSCount: Int? = null,
    @SerializedName("totalReceivedSMSCount") val totalReceivedSMSCount: Int? = null,
    @SerializedName("totalDeviceCount") val totalDeviceCount: Int? = null,
    @SerializedName("totalApiKeyCount") val totalApiKeyCount: Int? = null
)
