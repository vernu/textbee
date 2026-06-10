package com.vernu.sms.database.local

/*
import androidx.annotation.NonNull
import androidx.room.*
import java.util.Date

@Entity(tableName = "sms")
@TypeConverters(DateConverter::class)
data class Sms(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "_id") val serverId: String? = null,
    @ColumnInfo(name = "message") val message: String = "",
    @ColumnInfo(name = "encrypted_message") val encryptedMessage: String = "",
    @ColumnInfo(name = "is_encrypted", defaultValue = "0") val isEncrypted: Boolean = false,
    @ColumnInfo(name = "sender") val sender: String? = null,
    @ColumnInfo(name = "recipient") val recipient: String? = null,
    @ColumnInfo(name = "requested_at") val requestedAt: Date? = null,
    @ColumnInfo(name = "sent_at") val sentAt: Date? = null,
    @ColumnInfo(name = "delivered_at") val deliveredAt: Date? = null,
    @ColumnInfo(name = "received_at") val receivedAt: Date? = null,
    @ColumnInfo(name = "type") @field:NonNull val type: String = "",
    @ColumnInfo(name = "server_acknowledged_at") val serverAcknowledgedAt: Date? = null,
    @ColumnInfo(name = "last_acknowledged_request_at") val lastAcknowledgedRequestAt: Date? = null,
    @ColumnInfo(name = "retry_count", defaultValue = "0") val retryCount: Int = 0
) {
    fun hasServerAcknowledged(): Boolean = serverAcknowledgedAt != null
}
*/
