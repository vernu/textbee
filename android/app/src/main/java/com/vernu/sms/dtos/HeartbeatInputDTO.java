package com.vernu.sms.dtos;

public class HeartbeatInputDTO {
    private String fcmToken;
    private Integer batteryPercentage;
    private Boolean isCharging;
    private String networkType;
    private String appVersionName;
    private Integer appVersionCode;
    private Long deviceUptimeMillis;
    private Long memoryFreeBytes;
    private Long memoryTotalBytes;
    private Long memoryMaxBytes;
    private Long storageAvailableBytes;
    private Long storageTotalBytes;
    private String timezone;
    private String locale;
    private Boolean receiveSMSEnabled;
    private SimInfoCollectionDTO simInfo;

    public HeartbeatInputDTO() {
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public Integer getBatteryPercentage() {
        return batteryPercentage;
    }

    public void setBatteryPercentage(Integer batteryPercentage) {
        this.batteryPercentage = batteryPercentage;
    }

    public Boolean getIsCharging() {
        return isCharging;
    }

    public void setIsCharging(Boolean isCharging) {
        this.isCharging = isCharging;
    }

    public String getNetworkType() {
        return networkType;
    }

    public void setNetworkType(String networkType) {
        this.networkType = networkType;
    }

    public String getAppVersionName() {
        return appVersionName;
    }

    public void setAppVersionName(String appVersionName) {
        this.appVersionName = appVersionName;
    }

    public Integer getAppVersionCode() {
        return appVersionCode;
    }

    public void setAppVersionCode(Integer appVersionCode) {
        this.appVersionCode = appVersionCode;
    }

    public Long getDeviceUptimeMillis() {
        return deviceUptimeMillis;
    }

    public void setDeviceUptimeMillis(Long deviceUptimeMillis) {
        this.deviceUptimeMillis = deviceUptimeMillis;
    }

    public Long getMemoryFreeBytes() {
        return memoryFreeBytes;
    }

    public void setMemoryFreeBytes(Long memoryFreeBytes) {
        this.memoryFreeBytes = memoryFreeBytes;
    }

    public Long getMemoryTotalBytes() {
        return memoryTotalBytes;
    }

    public void setMemoryTotalBytes(Long memoryTotalBytes) {
        this.memoryTotalBytes = memoryTotalBytes;
    }

    public Long getMemoryMaxBytes() {
        return memoryMaxBytes;
    }

    public void setMemoryMaxBytes(Long memoryMaxBytes) {
        this.memoryMaxBytes = memoryMaxBytes;
    }

    public Long getStorageAvailableBytes() {
        return storageAvailableBytes;
    }

    public void setStorageAvailableBytes(Long storageAvailableBytes) {
        this.storageAvailableBytes = storageAvailableBytes;
    }

    public Long getStorageTotalBytes() {
        return storageTotalBytes;
    }

    public void setStorageTotalBytes(Long storageTotalBytes) {
        this.storageTotalBytes = storageTotalBytes;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public Boolean getReceiveSMSEnabled() {
        return receiveSMSEnabled;
    }

    public void setReceiveSMSEnabled(Boolean receiveSMSEnabled) {
        this.receiveSMSEnabled = receiveSMSEnabled;
    }

    public SimInfoCollectionDTO getSimInfo() {
        return simInfo;
    }

    public void setSimInfo(SimInfoCollectionDTO simInfo) {
        this.simInfo = simInfo;
    }
}
