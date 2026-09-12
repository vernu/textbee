package com.vernu.sms;

import com.vernu.sms.services.GatewayApiService;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
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

    /** Adds the client name to every request. See AppConstants.CLIENT_NAME. */
    static OkHttpClient createHttpClient() {
        return new OkHttpClient.Builder()
                .addInterceptor(new Interceptor() {
                    @Override
                    public Response intercept(Chain chain) throws IOException {
                        Request request = chain.request()
                                .newBuilder()
                                .header(AppConstants.CLIENT_HEADER, AppConstants.CLIENT_NAME)
                                .build();
                        return chain.proceed(request);
                    }
                })
                .build();
    }

    private static GatewayApiService createApiService() {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(AppConstants.API_BASE_URL)
                .client(createHttpClient())
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        return retrofit.create(GatewayApiService.class);
    }
}
