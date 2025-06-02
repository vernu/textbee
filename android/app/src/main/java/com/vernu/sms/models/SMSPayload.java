package com.vernu.sms.models;

public class SMSPayload {

    private String[] recipients;
    private String message;
    private String smsId;
    private String smsBatchId;

    // Legacy fields that are no longer used
    private String[] receivers;
    private String smsBody;

    public SMSPayload() {
    }

    public String[] getRecipients() {
        return recipients;
    }

    public void setRecipients(String[] recipients) {
        this.recipients = recipients;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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
}
