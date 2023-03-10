package com.vernu.sms.services;

import com.vernu.sms.dtos.RegisterDeviceInputDTO;
import com.vernu.sms.dtos.RegisterDeviceResponseDTO;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface GatewayApiService {
    @POST("gateway/devices")
    Call<RegisterDeviceResponseDTO> registerDevice(@Query("apiKey") String apiKey, @Body() RegisterDeviceInputDTO body);

    @PATCH("gateway/devices/{deviceId}")
    Call<RegisterDeviceResponseDTO> updateDevice(@Path("deviceId") String deviceId, @Query("apiKey") String apiKey, @Body() RegisterDeviceInputDTO body);
}