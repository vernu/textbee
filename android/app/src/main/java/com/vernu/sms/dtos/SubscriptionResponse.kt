package com.vernu.sms.dtos

import com.google.gson.annotations.SerializedName

data class SubscriptionResponse(
    @SerializedName("plan") val plan: SubscriptionPlan? = null,
    @SerializedName("currentPeriodStart") val currentPeriodStart: String? = null,
    @SerializedName("currentPeriodEnd") val currentPeriodEnd: String? = null,
    @SerializedName("isActive") val isActive: Boolean? = null,
    @SerializedName("usage") val usage: SubscriptionUsage? = null
)

data class SubscriptionPlan(
    @SerializedName("name") val name: String? = null,
    @SerializedName("displayName") val displayName: String? = null
)

data class SubscriptionUsage(
    @SerializedName("processedSmsToday") val processedSmsToday: Int? = null,
    @SerializedName("processedSmsLastMonth") val processedSmsLastMonth: Int? = null,
    @SerializedName("dailyLimit") val dailyLimit: Int? = null,
    @SerializedName("monthlyLimit") val monthlyLimit: Int? = null,
    @SerializedName("dailyRemaining") val dailyRemaining: Int? = null,
    @SerializedName("monthlyRemaining") val monthlyRemaining: Int? = null,
    @SerializedName("dailyUsagePercentage") val dailyUsagePercentage: Int? = null,
    @SerializedName("monthlyUsagePercentage") val monthlyUsagePercentage: Int? = null
)
