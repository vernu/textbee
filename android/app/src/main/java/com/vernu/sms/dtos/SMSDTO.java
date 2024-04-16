package com.vernu.sms.dtos;

import java.util.Date;

public class SMSDTO {
    private String sender;
    private String message;
    private Date receivedAt;

    public SMSDTO() {
    }

    public SMSDTO(String sender, String message, Date receivedAt) {
        this.sender = sender;
        this.message = message;
        this.receivedAt = receivedAt;
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

    public Date getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Date receivedAt) {
        this.receivedAt = receivedAt;
    }
}
