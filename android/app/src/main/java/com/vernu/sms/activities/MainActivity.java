package com.vernu.sms.activities;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import com.google.android.material.snackbar.Snackbar;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import com.vernu.sms.ApiManager;
import com.vernu.sms.AppConstants;
import com.vernu.sms.BuildConfig;
import com.vernu.sms.TextBeeUtils;
import com.vernu.sms.R;
import com.vernu.sms.dtos.RegisterDeviceInputDTO;
import com.vernu.sms.dtos.RegisterDeviceResponseDTO;
import com.vernu.sms.helpers.SharedPreferenceHelper;
import com.vernu.sms.helpers.VersionTracker;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import java.util.Arrays;
import java.util.Objects;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private Context mContext;
    private Switch gatewaySwitch, receiveSMSSwitch, stickyNotificationSwitch;
    private EditText apiKeyEditText, fcmTokenEditText, deviceIdEditText;
    private Button registerDeviceBtn, grantSMSPermissionBtn, scanQRBtn, checkUpdatesBtn;
    private ImageButton copyDeviceIdImgBtn;
    private TextView deviceBrandAndModelTxt, deviceIdTxt, appVersionNameTxt, appVersionCodeTxt;
    private RadioGroup defaultSimSlotRadioGroup;
    private static final int SCAN_QR_REQUEST_CODE = 49374;
    private static final int PERMISSION_REQUEST_CODE = 0;
    private String deviceId = null;
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mContext = getApplicationContext();
        deviceId = SharedPreferenceHelper.getSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        setContentView(R.layout.activity_main);
        gatewaySwitch = findViewById(R.id.gatewaySwitch);
        receiveSMSSwitch = findViewById(R.id.receiveSMSSwitch);
        stickyNotificationSwitch = findViewById(R.id.stickyNotificationSwitch);
        apiKeyEditText = findViewById(R.id.apiKeyEditText);
        fcmTokenEditText = findViewById(R.id.fcmTokenEditText);
        deviceIdEditText = findViewById(R.id.deviceIdEditText);
        registerDeviceBtn = findViewById(R.id.registerDeviceBtn);
        grantSMSPermissionBtn = findViewById(R.id.grantSMSPermissionBtn);
        scanQRBtn = findViewById(R.id.scanQRButton);
        deviceBrandAndModelTxt = findViewById(R.id.deviceBrandAndModelTxt);
        deviceIdTxt = findViewById(R.id.deviceIdTxt);
        copyDeviceIdImgBtn = findViewById(R.id.copyDeviceIdImgBtn);
        defaultSimSlotRadioGroup = findViewById(R.id.defaultSimSlotRadioGroup);
        appVersionNameTxt = findViewById(R.id.appVersionNameTxt);
        appVersionCodeTxt = findViewById(R.id.appVersionCodeTxt);
        checkUpdatesBtn = findViewById(R.id.checkUpdatesBtn);

        deviceIdTxt.setText(deviceId);
        deviceIdEditText.setText(deviceId);
        deviceBrandAndModelTxt.setText(Build.BRAND + " " + Build.MODEL);
        
        // Set app version information
        String versionName = BuildConfig.VERSION_NAME;
        appVersionNameTxt.setText(versionName);
        appVersionCodeTxt.setText(String.valueOf(BuildConfig.VERSION_CODE));
        
        // Check for app version changes and report if needed
        if (VersionTracker.hasVersionChanged(mContext)) {
            Log.d(TAG, "App version changed or first launch, reporting to server");
            VersionTracker.reportVersionToServer(mContext);
        }
        
        // Initialize Crashlytics with user information
        FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
        crashlytics.setCustomKey("device_id", deviceId != null ? deviceId : "not_registered");
        crashlytics.setCustomKey("device_model", Build.MODEL);
        crashlytics.setCustomKey("app_version", versionName);
        crashlytics.setCustomKey("app_version_code", BuildConfig.VERSION_CODE);

        // Start sticky notification service if enabled
        boolean gatewayEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, false);
        boolean stickyNotificationEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY, false);
        if (gatewayEnabled && stickyNotificationEnabled) {
            TextBeeUtils.startStickyNotificationService(mContext);
            Log.d(TAG, "Starting sticky notification service on app start");
        }

        if (deviceId == null || deviceId.isEmpty()) {
            registerDeviceBtn.setText("Register");
        } else {
            registerDeviceBtn.setText("Update");
        }

        String[] missingPermissions = Arrays.stream(AppConstants.requiredPermissions).filter(permission -> !TextBeeUtils.isPermissionGranted(mContext, permission)).toArray(String[]::new);
        if (missingPermissions.length == 0) {
            grantSMSPermissionBtn.setEnabled(false);
            grantSMSPermissionBtn.setText("Permission Granted");
            renderAvailableSimOptions();
        } else {
            Snackbar.make(grantSMSPermissionBtn, "Please Grant Required Permissions to continue: " + Arrays.toString(missingPermissions), Snackbar.LENGTH_SHORT).show();
            grantSMSPermissionBtn.setEnabled(true);
            grantSMSPermissionBtn.setOnClickListener(this::handleRequestPermissions);
        }

//        TextBeeUtils.startStickyNotificationService(mContext);

        copyDeviceIdImgBtn.setOnClickListener(view -> {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("Device ID", deviceId);
            clipboard.setPrimaryClip(clip);
            Snackbar.make(view, "Copied", Snackbar.LENGTH_LONG).show();
        });

        apiKeyEditText.setText(SharedPreferenceHelper.getSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_API_KEY_KEY, ""));
        gatewaySwitch.setChecked(SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, false));
        gatewaySwitch.setOnCheckedChangeListener((compoundButton, isCheked) -> {
            View view = compoundButton.getRootView();
            compoundButton.setEnabled(false);
            String key = apiKeyEditText.getText().toString();

            RegisterDeviceInputDTO registerDeviceInput = new RegisterDeviceInputDTO();
            registerDeviceInput.setEnabled(isCheked);
            registerDeviceInput.setAppVersionCode(BuildConfig.VERSION_CODE);
            registerDeviceInput.setAppVersionName(BuildConfig.VERSION_NAME);

            Call<RegisterDeviceResponseDTO> apiCall = ApiManager.getApiService().updateDevice(deviceId, key, registerDeviceInput);
            apiCall.enqueue(new Callback<RegisterDeviceResponseDTO>() {
                @Override
                public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {
                    Log.d(TAG, response.toString());
                    if (!response.isSuccessful()) {
                        Snackbar.make(view, response.message().isEmpty() ? "An error occurred :( "+ response.code() : response.message(), Snackbar.LENGTH_LONG).show();
                        compoundButton.setEnabled(true);
                        return;
                    }
                    Snackbar.make(view, "Gateway " + (isCheked ? "enabled" : "disabled"), Snackbar.LENGTH_LONG).show();
                    SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, isCheked);
                    boolean enabled = Boolean.TRUE.equals(Objects.requireNonNull(response.body()).data.get("enabled"));
                    compoundButton.setChecked(enabled);
                    if (enabled) {
                        // Check if sticky notification is enabled
                        if (SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY, false)) {
                            TextBeeUtils.startStickyNotificationService(mContext);
                        }
                    } else {
                        TextBeeUtils.stopStickyNotificationService(mContext);
                    }
                    compoundButton.setEnabled(true);
                }
                @Override
                public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                    Snackbar.make(view, "An error occurred :(", Snackbar.LENGTH_LONG).show();
                    Log.e(TAG, "API_ERROR "+ t.getMessage());
                    Log.e(TAG, "API_ERROR "+ t.getLocalizedMessage());
                    TextBeeUtils.logException(t, "Error updating device");
                    compoundButton.setEnabled(true);
                }
            });
        });

        receiveSMSSwitch.setChecked(SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY, false));
        receiveSMSSwitch.setOnCheckedChangeListener((compoundButton, isCheked) -> {
            View view = compoundButton.getRootView();
            SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_RECEIVE_SMS_ENABLED_KEY, isCheked);
            compoundButton.setChecked(isCheked);
            Snackbar.make(view, "Receive SMS " + (isCheked ? "enabled" : "disabled"), Snackbar.LENGTH_LONG).show();
        });

        // Setup sticky notification switch
        stickyNotificationSwitch.setChecked(SharedPreferenceHelper.getSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY, false));
        stickyNotificationSwitch.setOnCheckedChangeListener((compoundButton, isChecked) -> {
            View view = compoundButton.getRootView();
            SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY, isChecked);
            
            if (isChecked) {
                TextBeeUtils.startStickyNotificationService(mContext);
                Snackbar.make(view, "Background service enabled - app will be more reliable", Snackbar.LENGTH_LONG).show();
            } else {
                TextBeeUtils.stopStickyNotificationService(mContext);
                Snackbar.make(view, "Background service disabled - app may be killed when in background", Snackbar.LENGTH_LONG).show();
            }
        });

        // TODO: check gateway status/api key/device validity and update UI accordingly
        registerDeviceBtn.setOnClickListener(view -> {
            String _deviceId = SharedPreferenceHelper.getSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
            if (_deviceId == null || _deviceId.isEmpty()) {
                handleRegisterDevice();
            } else {
                handleUpdateDevice();
            }
        });
        scanQRBtn.setOnClickListener(view -> {
            IntentIntegrator intentIntegrator = new IntentIntegrator(MainActivity.this);
            intentIntegrator.setPrompt("Go to textbee.dev/dashboard and click Register Device to generate QR Code");
            intentIntegrator.setRequestCode(SCAN_QR_REQUEST_CODE);
            intentIntegrator.initiateScan();
        });
        
        checkUpdatesBtn.setOnClickListener(view -> {
            String versionInfo = BuildConfig.VERSION_NAME + "(" + BuildConfig.VERSION_CODE + ")";
            String encodedVersionInfo = android.net.Uri.encode(versionInfo);
            String downloadUrl = "https://textbee.dev/download?currentVersion=" + encodedVersionInfo;
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(downloadUrl));
            startActivity(browserIntent);
        });
    }

    private void renderAvailableSimOptions() {
        try {
            defaultSimSlotRadioGroup.removeAllViews();
            
            // Set radio group styling for dark mode compatibility
            defaultSimSlotRadioGroup.setBackgroundColor(getResources().getColor(R.color.background_secondary));
            defaultSimSlotRadioGroup.setPadding(16, 8, 16, 8);
            
            // Create the default radio button with proper styling
            RadioButton defaultSimSlotRadioBtn = new RadioButton(mContext);
            defaultSimSlotRadioBtn.setText("Device Default");
            defaultSimSlotRadioBtn.setId((int)123456);
            applyRadioButtonStyle(defaultSimSlotRadioBtn);
            defaultSimSlotRadioGroup.addView(defaultSimSlotRadioBtn);
            
            // Create radio buttons for each SIM with proper styling
            TextBeeUtils.getAvailableSimSlots(mContext).forEach(subscriptionInfo -> {
                String simInfo = "SIM " + (subscriptionInfo.getSimSlotIndex() + 1) + " (" + subscriptionInfo.getDisplayName() + ")";
                RadioButton radioButton = new RadioButton(mContext);
                radioButton.setText(simInfo);
                radioButton.setId(subscriptionInfo.getSubscriptionId());
                applyRadioButtonStyle(radioButton);
                defaultSimSlotRadioGroup.addView(radioButton);
            });

            // Check the preferred SIM based on saved preferences
            int preferredSim = SharedPreferenceHelper.getSharedPreferenceInt(mContext, AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY, -1);
            if (preferredSim == -1) {
                defaultSimSlotRadioGroup.check(defaultSimSlotRadioBtn.getId());
            } else {
                defaultSimSlotRadioGroup.check(preferredSim);
            }
            
            // Set the listener for SIM selection changes
            defaultSimSlotRadioGroup.setOnCheckedChangeListener((radioGroup, i) -> {
                RadioButton radioButton = findViewById(i);
                if (radioButton == null) {
                    return;
                }
                radioButton.setChecked(true);
                if("Device Default".equals(radioButton.getText().toString())) {
                    SharedPreferenceHelper.clearSharedPreference(mContext, AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY);
                } else {
                    SharedPreferenceHelper.setSharedPreferenceInt(mContext, AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY, radioButton.getId());
                }
            });
        } catch (Exception e) {
            Snackbar.make(defaultSimSlotRadioGroup.getRootView(), "Error: " + e.getMessage(), Snackbar.LENGTH_LONG).show();
            Log.e(TAG, "SIM_SLOT_ERROR "+ e.getMessage());
        }
    }
    
    /**
     * Apply the custom radio button style to a programmatically created radio button
     */
    private void applyRadioButtonStyle(RadioButton radioButton) {
        // Set text color using the color state list for proper dark/light mode handling
        setRadioButtonTextColor(radioButton);
        
        // Set button tint for the radio circle
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                radioButton.setButtonTintList(getResources().getColorStateList(R.color.radio_button_tint, getTheme()));
            } else {
                radioButton.setButtonTintList(getResources().getColorStateList(R.color.radio_button_tint));
            }
        }
        
        // Add proper padding for better touch experience
        radioButton.setPadding(
            radioButton.getPaddingLeft() + 8,
            radioButton.getPaddingTop() + 12,
            radioButton.getPaddingRight(),
            radioButton.getPaddingBottom() + 12
        );
    }
    
    /**
     * Helper method to set radio button text color in a backward-compatible way
     */
    private void setRadioButtonTextColor(RadioButton radioButton) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            radioButton.setTextColor(getResources().getColorStateList(R.color.radio_button_text_color, getTheme()));
        } else {
            radioButton.setTextColor(getResources().getColorStateList(R.color.radio_button_text_color));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != PERMISSION_REQUEST_CODE) {
            return;
        }
        boolean allPermissionsGranted = Arrays.stream(permissions).allMatch(permission -> TextBeeUtils.isPermissionGranted(mContext, permission));
        if (allPermissionsGranted) {
            Snackbar.make(findViewById(R.id.grantSMSPermissionBtn), "All Permissions Granted", Snackbar.LENGTH_SHORT).show();
            grantSMSPermissionBtn.setEnabled(false);
            grantSMSPermissionBtn.setText("Permission Granted");
            renderAvailableSimOptions();
        } else {
            Snackbar.make(findViewById(R.id.grantSMSPermissionBtn), "Please Grant Required Permissions to continue", Snackbar.LENGTH_SHORT).show();
        }
    }

    private void handleRegisterDevice() {
        String newKey = apiKeyEditText.getText().toString();
        String deviceIdInput = deviceIdEditText.getText().toString();
        
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
                    registerDeviceInput.setAppVersionCode(BuildConfig.VERSION_CODE);
                    registerDeviceInput.setAppVersionName(BuildConfig.VERSION_NAME);
                    
                    // If the user provided a device ID, use it for updating instead of creating new
                    if (!deviceIdInput.isEmpty()) {
                        Log.d(TAG, "Updating device with deviceId: "+ deviceIdInput);
                        Call<RegisterDeviceResponseDTO> apiCall = ApiManager.getApiService().updateDevice(deviceIdInput, newKey, registerDeviceInput);
                        apiCall.enqueue(new Callback<RegisterDeviceResponseDTO>() {
                            @Override
                            public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {
                                Log.d(TAG, response.toString());
                                if (!response.isSuccessful()) {
                                    Snackbar.make(view, response.message().isEmpty() ? "An error occurred :( "+ response.code() : response.message(), Snackbar.LENGTH_LONG).show();
                                    registerDeviceBtn.setEnabled(true);
                                    registerDeviceBtn.setText("Update");
                                    return;
                                }
                                SharedPreferenceHelper.setSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_API_KEY_KEY, newKey);
                                Snackbar.make(view, "Device Updated Successfully :)", Snackbar.LENGTH_LONG).show();
                                
                                // Update deviceId from response if available
                                if (response.body() != null && response.body().data != null && response.body().data.get("_id") != null) {
                                    deviceId = response.body().data.get("_id").toString();
                                    deviceIdTxt.setText(deviceId);
                                    deviceIdEditText.setText(deviceId);
                                    SharedPreferenceHelper.setSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, deviceId);
                                    SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, registerDeviceInput.isEnabled());
                                    gatewaySwitch.setChecked(registerDeviceInput.isEnabled());
                                }
                                
                                // Update stored version information
                                VersionTracker.updateStoredVersion(mContext);
                                
                                registerDeviceBtn.setEnabled(true);
                                registerDeviceBtn.setText("Update");
                            }
                            
                            @Override
                            public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                                Snackbar.make(view, "An error occurred :(", Snackbar.LENGTH_LONG).show();
                                Log.e(TAG, "API_ERROR "+ t.getMessage());
                                Log.e(TAG, "API_ERROR "+ t.getLocalizedMessage());
                                TextBeeUtils.logException(t, "Error registering device");
                                registerDeviceBtn.setEnabled(true);
                                registerDeviceBtn.setText("Update");
                            }
                        });
                        return;
                    }

                    Call<RegisterDeviceResponseDTO> apiCall = ApiManager.getApiService().registerDevice(newKey, registerDeviceInput);
                    apiCall.enqueue(new Callback<RegisterDeviceResponseDTO>() {
                        @Override
                        public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {
                            Log.d(TAG, response.toString());
                            if (!response.isSuccessful()) {
                                Snackbar.make(view, response.message().isEmpty() ? "An error occurred :( "+ response.code() : response.message(), Snackbar.LENGTH_LONG).show();
                                registerDeviceBtn.setEnabled(true);
                                registerDeviceBtn.setText("Update");
                                return;
                            }
                            SharedPreferenceHelper.setSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_API_KEY_KEY, newKey);
                            Snackbar.make(view, "Device Registration Successful :)", Snackbar.LENGTH_LONG).show();
                            
                            if (response.body() != null && response.body().data != null && response.body().data.get("_id") != null) {
                                deviceId = response.body().data.get("_id").toString();
                                deviceIdTxt.setText(deviceId);
                                deviceIdEditText.setText(deviceId);
                                SharedPreferenceHelper.setSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, deviceId);
                                SharedPreferenceHelper.setSharedPreferenceBoolean(mContext, AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, registerDeviceInput.isEnabled());
                                gatewaySwitch.setChecked(registerDeviceInput.isEnabled());
                            }
                            
                            // Update stored version information
                            VersionTracker.updateStoredVersion(mContext);
                            
                            registerDeviceBtn.setEnabled(true);
                            registerDeviceBtn.setText("Update");
                        }
                        @Override
                        public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                            Snackbar.make(view, "An error occurred :(", Snackbar.LENGTH_LONG).show();
                            Log.e(TAG, "API_ERROR "+ t.getMessage());
                            Log.e(TAG, "API_ERROR "+ t.getLocalizedMessage());
                            TextBeeUtils.logException(t, "Error registering device");
                            registerDeviceBtn.setEnabled(true);
                            registerDeviceBtn.setText("Update");
                        }
                    });
                });
    }

    private void handleUpdateDevice() {
        String apiKey = apiKeyEditText.getText().toString();
        String deviceIdInput = deviceIdEditText.getText().toString();
        String deviceIdToUse = !deviceIdInput.isEmpty() ? deviceIdInput : deviceId;
        
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

                    RegisterDeviceInputDTO updateDeviceInput = new RegisterDeviceInputDTO();
                    updateDeviceInput.setEnabled(true);
                    updateDeviceInput.setFcmToken(token);
                    updateDeviceInput.setBrand(Build.BRAND);
                    updateDeviceInput.setManufacturer(Build.MANUFACTURER);
                    updateDeviceInput.setModel(Build.MODEL);
                    updateDeviceInput.setBuildId(Build.ID);
                    updateDeviceInput.setOs(Build.VERSION.BASE_OS);
                    updateDeviceInput.setAppVersionCode(BuildConfig.VERSION_CODE);
                    updateDeviceInput.setAppVersionName(BuildConfig.VERSION_NAME);

                    Call<RegisterDeviceResponseDTO> apiCall = ApiManager.getApiService().updateDevice(deviceIdToUse, apiKey, updateDeviceInput);
                    apiCall.enqueue(new Callback<RegisterDeviceResponseDTO>() {
                        @Override
                        public void onResponse(Call<RegisterDeviceResponseDTO> call, Response<RegisterDeviceResponseDTO> response) {
                            Log.d(TAG, response.toString());
                            if (!response.isSuccessful()) {
                                Snackbar.make(view, response.message().isEmpty() ? "An error occurred :( "+ response.code() : response.message(), Snackbar.LENGTH_LONG).show();
                                registerDeviceBtn.setEnabled(true);
                                registerDeviceBtn.setText("Update");
                                return;
                            }
                            SharedPreferenceHelper.setSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_API_KEY_KEY, apiKey);
                            
                            // Update deviceId from response if available
                            if (response.body() != null && response.body().data != null && response.body().data.get("_id") != null) {
                                deviceId = response.body().data.get("_id").toString();
                                SharedPreferenceHelper.setSharedPreferenceString(mContext, AppConstants.SHARED_PREFS_DEVICE_ID_KEY, deviceId);
                                deviceIdTxt.setText(deviceId);
                                deviceIdEditText.setText(deviceId);
                            }
                            
                            // Update stored version information
                            VersionTracker.updateStoredVersion(mContext);
                            
                            Snackbar.make(view, "Device Updated Successfully :)", Snackbar.LENGTH_LONG).show();
                            registerDeviceBtn.setEnabled(true);
                            registerDeviceBtn.setText("Update");
                        }

                        @Override
                        public void onFailure(Call<RegisterDeviceResponseDTO> call, Throwable t) {
                            Snackbar.make(view, "An error occurred :(", Snackbar.LENGTH_LONG).show();
                            Log.e(TAG, "API_ERROR "+ t.getMessage());
                            Log.e(TAG, "API_ERROR "+ t.getLocalizedMessage());
                            TextBeeUtils.logException(t, "Error updating device");
                            registerDeviceBtn.setEnabled(true);
                            registerDeviceBtn.setText("Update");
                        }
                    });
                });
    }

    private void handleRequestPermissions(View view) {
        boolean allPermissionsGranted = Arrays.stream(AppConstants.requiredPermissions).allMatch(permission -> TextBeeUtils.isPermissionGranted(mContext, permission));
        if (allPermissionsGranted) {
            Snackbar.make(view, "Already got permissions", Snackbar.LENGTH_SHORT).show();
            return;
        }
        String[] permissionsToRequest = Arrays.stream(AppConstants.requiredPermissions).filter(permission -> !TextBeeUtils.isPermissionGranted(mContext, permission)).toArray(String[]::new);
        Snackbar.make(view, "Please Grant Required Permissions to continue", Snackbar.LENGTH_SHORT).show();
        ActivityCompat.requestPermissions(this, permissionsToRequest, PERMISSION_REQUEST_CODE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SCAN_QR_REQUEST_CODE) {
            IntentResult intentResult = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
            if (intentResult == null || intentResult.getContents() == null) {
                Toast.makeText(getBaseContext(), "Canceled", Toast.LENGTH_SHORT).show();
                return;
            }
            String scannedQR = intentResult.getContents();
            apiKeyEditText.setText(scannedQR);
            if(deviceIdEditText.getText().toString().isEmpty()) {
                handleRegisterDevice();
            } else {
                handleUpdateDevice();
            }
        }
    }

}
