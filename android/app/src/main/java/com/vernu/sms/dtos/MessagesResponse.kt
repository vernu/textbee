package com.vernu.sms.dtos

import com.google.gson.annotations.SerializedName

data class MessagesResponse(
    @SerializedName("data") val data: List<SmsMessage>? = null,
    @SerializedName("meta") val meta: PaginationMeta? = null
)

data class SmsMessage(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("sender") val sender: String? = null,
    @SerializedName("recipient") val recipient: String? = null,
    @SerializedName("recipients") val recipients: List<String>? = null,
    @SerializedName("requestedAt") val requestedAt: String? = null,
    @SerializedName("receivedAt") val receivedAt: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("errorCode") val errorCode: String? = null,
    @SerializedName("errorMessage") val errorMessage: String? = null
) {
    val isReceived: Boolean get() = sender != null
    val counterparty: String get() = if (isReceived) sender ?: "Unknown"
        else recipient ?: recipients?.firstOrNull() ?: "Unknown"
}

data class PaginationMeta(
    @SerializedName("page") val page: Int? = null,
    @SerializedName("limit") val limit: Int? = null,
    @SerializedName("total") val total: Int? = null,
    @SerializedName("totalPages") val totalPages: Int? = null
)

data class SendSmsRequest(
    @SerializedName("message") val message: String,
    @SerializedName("recipients") val recipients: List<String>
)
