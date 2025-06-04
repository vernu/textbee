package com.vernu.sms.dtos;

import java.util.Date;

public class SMSDTO {
    private String sender;
    private String message = "";
    private long receivedAtInMillis;

    private String smsId;
    private String smsBatchId;
    private String status;
    private long sentAtInMillis;
    private long deliveredAtInMillis;
    private long failedAtInMillis;
    private String errorCode;
    private String errorMessage;

    public SMSDTO() {
    }


    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public long getReceivedAtInMillis() {
        return receivedAtInMillis;
    }

    public void setReceivedAtInMillis(long receivedAtInMillis) {
        this.receivedAtInMillis = receivedAtInMillis;
    }

    public String getSmsId() {
        return smsId;
    }

    public void setSmsId(String smsId) {
        this.smsId = smsId;
    }

    public String getSmsBatchId() {
        return smsBatchId;
    }

    public void setSmsBatchId(String smsBatchId) {
        this.smsBatchId = smsBatchId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getSentAtInMillis() {
        return sentAtInMillis;
    }

    public void setSentAtInMillis(long sentAtInMillis) {
        this.sentAtInMillis = sentAtInMillis;
    }

    public long getDeliveredAtInMillis() {
        return deliveredAtInMillis;
    }

    public void setDeliveredAtInMillis(long deliveredAtInMillis) {
        this.deliveredAtInMillis = deliveredAtInMillis;
    }

    public long getFailedAtInMillis() {
        return failedAtInMillis;
    }

    public void setFailedAtInMillis(long failedAtInMillis) {
        this.failedAtInMillis = failedAtInMillis;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
