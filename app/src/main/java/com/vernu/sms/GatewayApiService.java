package com.vernu.sms;

import com.vernu.sms.dtos.UpdateFCMTokenInputDTO;
import com.vernu.sms.dtos.UpdateFCMTokenResponseDTO;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface GatewayApiService {
    @POST("gateway/devices/{deviceId}/updateFCMToken")
    Call<UpdateFCMTokenResponseDTO> updateFCMToken(@Path("deviceId") String deviceId, @Body() UpdateFCMTokenInputDTO body);
}