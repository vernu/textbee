package com.vernu.sms.database.local;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.TypeConverters;

import java.util.Date;

@Entity(tableName = "sms")
@TypeConverters(DateConverter.class)
public class SMS {

    @PrimaryKey(autoGenerate = true)
    private int id;

    @ColumnInfo(name = "message")
    private String message = "";

    @ColumnInfo(name = "sender")
    private String sender;

    @ColumnInfo(name = "received_at")
    private Date receivedAt;

    @NonNull
    @ColumnInfo(name = "type")
    private String type;


    @ColumnInfo(name = "server_acknowledged_at")
    private Date serverAcknowledgedAt;

    public SMS() {
        type = null;
    }

    public boolean hasServerAcknowledged() {
        return serverAcknowledgedAt != null;
    }

    @ColumnInfo(name = "last_acknowledged_request_at")
    private Date lastAcknowledgedRequestAt;

    @ColumnInfo(name = "retry_count", defaultValue = "0")
    private int retryCount = 0;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public Date getServerAcknowledgedAt() {
        return serverAcknowledgedAt;
    }

    public void setServerAcknowledgedAt(Date serverAcknowledgedAt) {
        this.serverAcknowledgedAt = serverAcknowledgedAt;
    }

    public Date getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Date receivedAt) {
        this.receivedAt = receivedAt;
    }

    @NonNull
    public String getType() {
        return type;
    }

    public void setType(@NonNull String type) {
        this.type = type;
    }


    public Date getLastAcknowledgedRequestAt() {
        return lastAcknowledgedRequestAt;
    }

    public void setLastAcknowledgedRequestAt(Date lastAcknowledgedRequestAt) {
        this.lastAcknowledgedRequestAt = lastAcknowledgedRequestAt;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }
}