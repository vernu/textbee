package com.vernu.sms;

import com.vernu.sms.dtos.UpdateDeviceInputDTO;
import com.vernu.sms.dtos.UpdateDeviceResponseDTO;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.PATCH;
import retrofit2.http.Path;

public interface GatewayApiService {
    @PATCH("gateway/devices/{deviceId}")
    Call<UpdateDeviceResponseDTO> updateDevice(@Path("deviceId") String deviceId, @Body() UpdateDeviceInputDTO body);
}