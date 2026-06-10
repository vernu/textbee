package com.vernu.sms.dtos

class HeartbeatInputDTO {
    var fcmToken: String? = null
    var batteryPercentage: Int? = null
    var isCharging: Boolean? = null
    var networkType: String? = null
    var appVersionName: String? = null
    var appVersionCode: Int? = null
    var deviceUptimeMillis: Long? = null
    var memoryFreeBytes: Long? = null
    var memoryTotalBytes: Long? = null
    var memoryMaxBytes: Long? = null
    var storageAvailableBytes: Long? = null
    var storageTotalBytes: Long? = null
    var timezone: String? = null
    var locale: String? = null
    var receiveSMSEnabled: Boolean? = null
    var smsSendDelaySeconds: Int? = null
    var simInfo: SimInfoCollectionDTO? = null
}
