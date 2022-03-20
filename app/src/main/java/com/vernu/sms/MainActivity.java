package com.vernu.sms;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Switch;
import android.widget.Toast;

import com.google.android.material.snackbar.Snackbar;

public class MainActivity extends AppCompatActivity {

    private Switch gatewaySwich;
    private EditText gatewayKeyEditText;
    private Button updateKeyButton, grantSMSPermissionBtn;

    private static final int SEND_SMS_PERMISSION_REQUEST_CODE = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        gatewaySwich = findViewById(R.id.gatewaySwitch);
        gatewayKeyEditText = findViewById(R.id.gatewayKeyEditText);
        updateKeyButton = findViewById(R.id.updateKeyButton);
        grantSMSPermissionBtn = findViewById(R.id.grantSMSPermissionBtn);

        if (isSMSPermissionGranted(getApplicationContext())) {
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


    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case SEND_SMS_PERMISSION_REQUEST_CODE: {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(getApplicationContext(), "Yay!   .",
                            Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(getApplicationContext(),
                            "Permission Denied :(", Toast.LENGTH_LONG).show();
                    return;
                }
            }
        }

    }

    private void handleSMSRequestPermission(View view) {
        if (isSMSPermissionGranted(view.getContext())) {
            Snackbar.make(view, "Already got permissions", Snackbar.LENGTH_SHORT).show();
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this,
                    Manifest.permission.SEND_SMS)) {
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