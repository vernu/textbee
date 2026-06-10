package com.vernu.sms.dtos

class SMSDTO {
    var sender: String? = null
    var message: String = ""
    var receivedAtInMillis: Long = 0
    var fingerprint: String? = null
    var smsId: String? = null
    var smsBatchId: String? = null
    var status: String? = null
    var sentAtInMillis: Long = 0
    var deliveredAtInMillis: Long = 0
    var failedAtInMillis: Long = 0
    var errorCode: String? = null
    var errorMessage: String? = null
}
