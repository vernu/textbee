package com.vernu.sms.helpers;

import android.telephony.SmsManager;

public class SMSHelper {
    public static void sendSMS(String phoneNo, String message) {
        SmsManager smsManager = SmsManager.getDefault();
        smsManager.sendTextMessage(phoneNo, null, message, null, null);
    }
}
