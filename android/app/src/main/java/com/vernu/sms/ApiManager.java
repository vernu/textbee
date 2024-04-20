package com.vernu.sms;

import com.vernu.sms.services.GatewayApiService;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiManager {
    private static GatewayApiService apiService;

    public static GatewayApiService getApiService() {
        if (apiService == null) {
            apiService = createApiService();
        }
        return apiService;
    }

    private static GatewayApiService createApiService() {
//        OkHttpClient.Builder httpClient = new OkHttpClient.Builder();
//        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
//        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
//        httpClient.addInterceptor(loggingInterceptor);

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(AppConstants.API_BASE_URL)
//                .client(httpClient.build())
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(GatewayApiService.class);

        return retrofit.create(GatewayApiService.class);
    }
}
