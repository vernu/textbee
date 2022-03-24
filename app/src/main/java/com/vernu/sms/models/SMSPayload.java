package com.vernu.sms.models;

public class SMSPayload {
    public String[] receivers;
    public String smsBody;

    public SMSPayload(String[] receivers, String smsBody) {
        this.receivers = receivers;
        this.smsBody = smsBody;
    }
}
