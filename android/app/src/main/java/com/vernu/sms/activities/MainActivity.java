package com.vernu.sms.activities;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.snackbar.Snackbar;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import com.vernu.sms.BuildConfig;
import com.vernu.sms.services.GatewayApiService;
import com.vernu.sms.R;
import com.vernu.sms.dtos.RegisterDeviceInputDTO;
import com.vernu.sms.dtos.RegisterDeviceResponseDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class MainActivity extends AppCompatActivity {

    private Context mContext;
    private Retrofit retrofit;
    private GatewayApiService gatewayApiService;

    private Switch gatewaySwitch;
    private EditText apiKeyEditText, fcmTokenEditText;
    private Button registerDeviceBtn, grantSMSPermissionBtn, scanQRBtn;
    private ImageButton copyDeviceIdImgBtn;
    private TextView deviceBrandAndModelTxt, deviceIdTxt;

    private static final int SEND_SMS_PERMISSION_REQUEST_CODE = 0;
    private static final int SCAN_QR_REQUEST_CODE = 49374;

    private static final String API_BASE_URL = BuildConfig.DEBUG ? "http://192.168.1.100:3006/api/v1/" : "https://api.sms.real.et/api/v1/";
    private String deviceId = null;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mContext = getApplicationContext();

        retrofit = new Retrofit.Builder()
                .baseUrl(API_BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        gatewayApiService = retrofit.create(GatewayApiService.class);

        deviceId = SharedPreferenceHelper.getSharedPreferenceString(mContext, "DEVICE_ID", "");

        setContentView(R.layout.activity_main);
        gatewaySwitch = findViewById(R.id.gatewaySwitch);
        apiKeyEditText = findViewById(R.id.apiKeyEditText);
        fcmTokenEditText = findViewById(R.id.fcmTokenEditText);
        registerDeviceBtn = findViewById(R.id.registerDeviceBtn);
        grantSMSPermissionBtn = findViewById(R.id.grantSMSPermissionBtn);
        scanQRBtn = findViewById(R.id.scanQRButton);


        deviceBrandAndModelTxt = findViewById(R.id.deviceBrandAndModelTxt);
        deviceIdTxt = findViewById(R.id.deviceIdTxt);

        copyDeviceIdImgBtn = findViewById(R.id.copyDeviceIdImgBtn);

        deviceIdTxt.setText(deviceId);
        deviceBrandAndModelTxt.setText(Build.BRAND + " " + Build.MODEL);

        if (isSMSPermissionGranted(mContext)) {
            grantSMSPermissionBtn.setEnabled(false);
            grantSMSPermissionBtn.setText("SMS Permission Granted");
        } else {
            grantSMSPermissionBtn.setOnClickListener(view -> handleSMSRequestPermission(view));
        }

        copyDeviceIdImgBtn.setOnClickListener(view -> {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("Device ID", deviceId);
            clipboard.setPrimaryClip(clip);
            Snackbar.make(view, "Copied", Snackbar.LENGTH_LONG).show();
        });

        apiKeyEditText.setText(SharedPreferenceHelper.getSharedPreferenceString(mContext, "API_KEY", ""));

        gatewaySwitch.setChecked(SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, "GATEWAY_ENABLED", false));
        gatewaySwitch.setOnCheckedChangeListener((compoundButton, isCheked) -> {
            View view = compoundButton.getRootView();
            compoundButton.setEnabled(false);
            String key = apiKeyEditText.getText().toString();


            RegisterDeviceInputDTO registerDeviceInput = new RegisterDeviceInputDTO();
            registerDeviceInput.setEnabled(isCheked);

            Call<RegisterDeviceResponseDTO> apiCall = gatewayApiService.updateDevice(deviceId, key, registerDeviceInput);
            apiCall.enqueue(new Callback<RegisterDeviceResponseDTO>() {
                @Override
                public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {

                    if (response.isSuccessful()) {
                        Snackbar.make(view, "Gateway " + (isCheked ? "enabled" : "disabled"), Snackbar.LENGTH_LONG).show();
                        SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, "GATEWAY_ENABLED", isCheked);
                        compoundButton.setChecked(Boolean.TRUE.equals(response.body().data.get("enabled")));
                    } else {
                        Snackbar.make(view, response.message(), Snackbar.LENGTH_LONG).show();
                    }
                    compoundButton.setEnabled(true);
                }

                @Override
                public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                    Snackbar.make(view, "An error occured :(", Snackbar.LENGTH_LONG).show();
                    compoundButton.setEnabled(true);

                }
            });


        });

        registerDeviceBtn.setOnClickListener(view -> handleRegisterDevice());

        scanQRBtn.setOnClickListener(view -> {
            IntentIntegrator intentIntegrator = new IntentIntegrator(MainActivity.this);
            intentIntegrator.setPrompt("Go to vernu-sms.vercel.app/dashboard and click Register Device to generate QR Code");
            intentIntegrator.setRequestCode(SCAN_QR_REQUEST_CODE);
            intentIntegrator.initiateScan();
        });


    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case SEND_SMS_PERMISSION_REQUEST_CODE: {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(mContext, "Yay!  Permission Granted.", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(mContext, "Permission Denied :(", Toast.LENGTH_LONG).show();
                    return;
                }
            }
        }

    }

    private void handleRegisterDevice() {

        String newKey = apiKeyEditText.getText().toString();
        registerDeviceBtn.setEnabled(false);
        registerDeviceBtn.setText("Loading...");
        View view = findViewById(R.id.registerDeviceBtn);

        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Snackbar.make(view, "Failed to obtain FCM Token :(", Snackbar.LENGTH_LONG).show();
                        registerDeviceBtn.setEnabled(true);
                        registerDeviceBtn.setText("Update");
                        return;
                    }
                    String token = task.getResult();
                    fcmTokenEditText.setText(token);

                    RegisterDeviceInputDTO registerDeviceInput = new RegisterDeviceInputDTO();
                    registerDeviceInput.setEnabled(true);
                    registerDeviceInput.setFcmToken(token);
                    registerDeviceInput.setBrand(Build.BRAND);
                    registerDeviceInput.setManufacturer(Build.MANUFACTURER);
                    registerDeviceInput.setModel(Build.MODEL);
                    registerDeviceInput.setBuildId(Build.ID);
                    registerDeviceInput.setOs(Build.VERSION.BASE_OS);


                    Call<RegisterDeviceResponseDTO> apiCall = gatewayApiService.registerDevice(newKey, registerDeviceInput);
                    apiCall.enqueue(new Callback<RegisterDeviceResponseDTO>() {
                        @Override
                        public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {

                            if (response.isSuccessful()) {
                                SharedPreferenceHelper.setSharedPreferenceString(mContext, "API_KEY", newKey);
                                Log.e("API_RESP", response.toString());
                                Snackbar.make(view, "Device Registration Successful :)", Snackbar.LENGTH_LONG).show();
                                deviceId = response.body().data.get("_id").toString();
                                deviceIdTxt.setText(deviceId);
                                SharedPreferenceHelper.setSharedPreferenceString(mContext, "DEVICE_ID", deviceId);

                            } else {
                                Snackbar.make(view, response.message(), Snackbar.LENGTH_LONG).show();
                            }
                            registerDeviceBtn.setEnabled(true);
                            registerDeviceBtn.setText("Update");
                        }

                        @Override
                        public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                            Snackbar.make(view, "An error occured :(", Snackbar.LENGTH_LONG).show();
                            registerDeviceBtn.setEnabled(true);
                            registerDeviceBtn.setText("Update");

                        }
                    });
                });
    }

    private void handleSMSRequestPermission(View view) {
        if (isSMSPermissionGranted(mContext)) {
            Snackbar.make(view, "Already got permissions", Snackbar.LENGTH_SHORT).show();
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.SEND_SMS)) {
                Snackbar.make(view, "PERMISSION DENIED, Pls grant SMS Permission in app settings", Snackbar.LENGTH_SHORT).show();
            } else {
                Snackbar.make(view, "Grant SMS Permissions to continue", Snackbar.LENGTH_SHORT).show();
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.SEND_SMS},
                        SEND_SMS_PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == SCAN_QR_REQUEST_CODE) {
            IntentResult intentResult = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);

            if (intentResult != null) {
                if (intentResult.getContents() == null) {
                    Toast.makeText(getBaseContext(), "Canceled", Toast.LENGTH_SHORT).show();
                } else {
                    String scannedQR = intentResult.getContents();
                    apiKeyEditText.setText(scannedQR);
                    handleRegisterDevice();
                }
            }
        }
    }

    private boolean isSMSPermissionGranted(Context context) {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
    }
}