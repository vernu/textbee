package com.vernu.sms.models;

public class SMSPayload {
    private String[] receivers;
    private String smsBody;

    public SMSPayload(String[] receivers, String smsBody) {
        this.receivers = receivers;
        this.smsBody = smsBody;
    }

    public String[] getReceivers() {
        return receivers;
    }

    public void setReceivers(String[] receivers) {
        this.receivers = receivers;
    }

    public String getSmsBody() {
        return smsBody;
    }

    public void setSmsBody(String smsBody) {
        this.smsBody = smsBody;
    }
}
