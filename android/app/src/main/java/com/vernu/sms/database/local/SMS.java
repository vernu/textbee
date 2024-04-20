//package com.vernu.sms.database.local;
//
//import androidx.annotation.NonNull;
//import androidx.room.ColumnInfo;
//import androidx.room.Entity;
//import androidx.room.PrimaryKey;
//import androidx.room.TypeConverters;
//
//import java.util.Date;
//
//@Entity(tableName = "sms")
//@TypeConverters(DateConverter.class)
//public class SMS {
//
//    public SMS() {
//        type = null;
//    }
//
//    @PrimaryKey(autoGenerate = true)
//    private int id;
//
//    // This is the ID of the SMS in the server
//    @ColumnInfo(name = "_id")
//    private String _id;
//
//    @ColumnInfo(name = "message")
//    private String message = "";
//
//    @ColumnInfo(name = "encrypted_message")
//    private String encryptedMessage = "";
//
//    @ColumnInfo(name = "is_encrypted", defaultValue = "0")
//    private boolean isEncrypted = false;
//
//    @ColumnInfo(name = "sender")
//    private String sender;
//
//    @ColumnInfo(name = "recipient")
//    private String recipient;
//
//    @ColumnInfo(name = "requested_at")
//    private Date requestedAt;
//
//    @ColumnInfo(name = "sent_at")
//    private Date sentAt;
//
//    @ColumnInfo(name = "delivered_at")
//    private Date deliveredAt;
//
//    @ColumnInfo(name = "received_at")
//    private Date receivedAt;
//
//    @NonNull
//    @ColumnInfo(name = "type")
//    private String type;
//
//    @ColumnInfo(name = "server_acknowledged_at")
//    private Date serverAcknowledgedAt;
//
//    public boolean hasServerAcknowledged() {
//        return serverAcknowledgedAt != null;
//    }
//
//    @ColumnInfo(name = "last_acknowledged_request_at")
//    private Date lastAcknowledgedRequestAt;
//
//    @ColumnInfo(name = "retry_count", defaultValue = "0")
//    private int retryCount = 0;
//
//    public int getId() {
//        return id;
//    }
//
//    public void setId(int id) {
//        this.id = id;
//    }
//
//    public String get_id() {
//        return _id;
//    }
//
//    public void set_id(String _id) {
//        this._id = _id;
//    }
//
//    public String getMessage() {
//        return message;
//    }
//
//    public void setMessage(String message) {
//        this.message = message;
//    }
//
//    public String getEncryptedMessage() {
//        return encryptedMessage;
//    }
//
//    public void setEncryptedMessage(String encryptedMessage) {
//        this.encryptedMessage = encryptedMessage;
//    }
//
//    public boolean getIsEncrypted() {
//        return isEncrypted;
//    }
//
//    public void setIsEncrypted(boolean isEncrypted) {
//        this.isEncrypted = isEncrypted;
//    }
//
//    public String getSender() {
//        return sender;
//    }
//
//    public void setSender(String sender) {
//        this.sender = sender;
//    }
//
//    public String getRecipient() {
//        return recipient;
//    }
//
//    public void setRecipient(String recipient) {
//        this.recipient = recipient;
//    }
//
//    public Date getServerAcknowledgedAt() {
//        return serverAcknowledgedAt;
//    }
//
//    public void setServerAcknowledgedAt(Date serverAcknowledgedAt) {
//        this.serverAcknowledgedAt = serverAcknowledgedAt;
//    }
//
//
//
//    public Date getRequestedAt() {
//        return requestedAt;
//    }
//
//    public void setRequestedAt(Date requestedAt) {
//        this.requestedAt = requestedAt;
//    }
//
//    public Date getSentAt() {
//        return sentAt;
//    }
//
//    public void setSentAt(Date sentAt) {
//        this.sentAt = sentAt;
//    }
//
//    public Date getDeliveredAt() {
//        return deliveredAt;
//    }
//
//    public void setDeliveredAt(Date deliveredAt) {
//        this.deliveredAt = deliveredAt;
//    }
//
//    public Date getReceivedAt() {
//        return receivedAt;
//    }
//
//    public void setReceivedAt(Date receivedAt) {
//        this.receivedAt = receivedAt;
//    }
//
//    @NonNull
//    public String getType() {
//        return type;
//    }
//
//    public void setType(@NonNull String type) {
//        this.type = type;
//    }
//
//
//    public Date getLastAcknowledgedRequestAt() {
//        return lastAcknowledgedRequestAt;
//    }
//
//    public void setLastAcknowledgedRequestAt(Date lastAcknowledgedRequestAt) {
//        this.lastAcknowledgedRequestAt = lastAcknowledgedRequestAt;
//    }
//
//    public int getRetryCount() {
//        return retryCount;
//    }
//
//    public void setRetryCount(int retryCount) {
//        this.retryCount = retryCount;
//    }
//}