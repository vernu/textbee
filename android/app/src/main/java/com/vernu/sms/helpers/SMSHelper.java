package com.vernu.sms.helpers;

import android.telephony.SmsManager;

import java.util.ArrayList;

public class SMSHelper {
    public static void sendSMS(String phoneNo, String message) {
        SmsManager smsManager = SmsManager.getDefault();

        //for sms with more than 160 chars
        ArrayList<String> parts = smsManager.divideMessage(message);
        if (parts.size() > 1) {
            smsManager.sendMultipartTextMessage(phoneNo, null, parts, null, null);
        } else {
            smsManager.sendTextMessage(phoneNo, null, message, null, null);
        }

    }

    public static void sendSMSFromSpecificSim(String phoneNo, String message, int simSlot) {
        SmsManager smsManager = SmsManager.getSmsManagerForSubscriptionId(simSlot);
        smsManager.sendMultipartTextMessage(phoneNo, null, smsManager.divideMessage(message), null, null);
    }
}
