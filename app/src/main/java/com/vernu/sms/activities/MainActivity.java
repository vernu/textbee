package com.vernu.sms.activities;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.Switch;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.android.material.snackbar.Snackbar;
import com.google.firebase.messaging.FirebaseMessaging;
import com.vernu.sms.GatewayApiService;
import com.vernu.sms.R;
import com.vernu.sms.dtos.UpdateDeviceInputDTO;
import com.vernu.sms.dtos.UpdateDeviceResponseDTO;
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
    private EditText gatewayKeyEditText, fcmTokenEditText;
    private Button updateKeyButton, grantSMSPermissionBtn;

    private static final int SEND_SMS_PERMISSION_REQUEST_CODE = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mContext = getApplicationContext();
        retrofit = new Retrofit.Builder()
                .baseUrl("https://vernu-sms.herokuapp.com/api/v1/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        gatewayApiService = retrofit.create(GatewayApiService.class);

        setContentView(R.layout.activity_main);
        gatewaySwitch = findViewById(R.id.gatewaySwitch);
        gatewayKeyEditText = findViewById(R.id.gatewayKeyEditText);
        fcmTokenEditText = findViewById(R.id.fcmTokenEditText);
        updateKeyButton = findViewById(R.id.updateKeyButton);
        grantSMSPermissionBtn = findViewById(R.id.grantSMSPermissionBtn);

        if (isSMSPermissionGranted(mContext)) {
            grantSMSPermissionBtn.setEnabled(false);
            grantSMSPermissionBtn.setText("SMS Permission Granted");
        } else {
            grantSMSPermissionBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    handleSMSRequestPermission(view);
                }
            });
        }


        gatewayKeyEditText.setText(SharedPreferenceHelper.getSharedPreferenceString(mContext, "GATEWAY_KEY", ""));

        gatewaySwitch.setChecked(SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, "GATEWAY_ENABLED", false));
        gatewaySwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isCheked) {
                View view = compoundButton.getRootView();
                compoundButton.setEnabled(false);
                String key = gatewayKeyEditText.getText().toString();


                UpdateDeviceInputDTO updateDeviceInput = new UpdateDeviceInputDTO();
                updateDeviceInput.setEnabled(isCheked);

                Call<UpdateDeviceResponseDTO> apiCall = gatewayApiService.updateFCMToken(key, updateDeviceInput);
                apiCall.enqueue(new Callback<UpdateDeviceResponseDTO>() {
                    @Override
                    public void onResponse(Call<UpdateDeviceResponseDTO> call, Response<UpdateDeviceResponseDTO> response) {

                        if (response.isSuccessful()) {
                            SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, "GATEWAY_ENABLED", isCheked);
                            Snackbar.make(view, "DONE :)", Snackbar.LENGTH_LONG).show();

                        } else {
                            Snackbar.make(view, response.message(), Snackbar.LENGTH_LONG).show();
                        }

                        compoundButton.setEnabled(true);
                    }

                    @Override
                    public void onFailure(Call<UpdateDeviceResponseDTO> call, Throwable t) {
                        Snackbar.make(view, "An error occured :(", Snackbar.LENGTH_LONG).show();
                        Log.d("ERR", t.toString());
                        compoundButton.setEnabled(true);

                    }
                });


            }
        });

        updateKeyButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String newKey = gatewayKeyEditText.getText().toString();
                updateKeyButton.setEnabled(false);
                updateKeyButton.setText("Loading...");

                FirebaseMessaging.getInstance().getToken()
                        .addOnCompleteListener(new OnCompleteListener<String>() {
                            @Override
                            public void onComplete(@NonNull Task<String> task) {
                                if (!task.isSuccessful()) {
                                    Snackbar.make(view, "Failed to obtain FCM Token :(", Snackbar.LENGTH_LONG).show();
                                    updateKeyButton.setEnabled(true);
                                    updateKeyButton.setText("Update");
                                    return;
                                }
                                String token = task.getResult();
                                fcmTokenEditText.setText(token);


                                UpdateDeviceInputDTO updateDeviceInput = new UpdateDeviceInputDTO();
                                updateDeviceInput.setEnabled(true);
                                updateDeviceInput.setBrand(Build.BRAND);
                                updateDeviceInput.setManufacturer(Build.MANUFACTURER);
                                updateDeviceInput.setModel(Build.MODEL);
                                updateDeviceInput.setBuildId(Build.ID);
                                updateDeviceInput.setOs(Build.VERSION.BASE_OS);


                                Call<UpdateDeviceResponseDTO> apiCall = gatewayApiService.updateFCMToken(newKey, updateDeviceInput);
                                apiCall.enqueue(new Callback<UpdateDeviceResponseDTO>() {
                                    @Override
                                    public void onResponse(Call<UpdateDeviceResponseDTO> call, Response<UpdateDeviceResponseDTO> response) {

                                        if (response.isSuccessful()) {
                                            SharedPreferenceHelper.setSharedPreferenceString(mContext, "GATEWAY_KEY", newKey);
                                            Log.e("API_RESP", response.toString());
                                            Snackbar.make(view, "DONE :)", Snackbar.LENGTH_LONG).show();

                                        } else {
                                            Snackbar.make(view, response.message(), Snackbar.LENGTH_LONG).show();
                                        }
                                        updateKeyButton.setEnabled(true);
                                        updateKeyButton.setText("Update");
                                    }

                                    @Override
                                    public void onFailure(Call<UpdateDeviceResponseDTO> call, Throwable t) {
                                        Snackbar.make(view, "An error occured :(", Snackbar.LENGTH_LONG).show();
                                        updateKeyButton.setEnabled(true);
                                        updateKeyButton.setText("Update");

                                    }
                                });
                            }
                        });


            }
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

    private boolean isSMSPermissionGranted(Context context) {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
    }
}