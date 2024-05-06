package com.vernu.sms.dtos;

import java.util.Date;

public class SMSDTO {
    private String sender;
    private String message = "";
    private long receivedAtInMillis;

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
}
