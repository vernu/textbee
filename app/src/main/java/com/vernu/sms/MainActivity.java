package com.vernu.sms;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Switch;

import com.google.android.material.snackbar.Snackbar;

public class MainActivity extends AppCompatActivity {

    private Switch gatewaySwich;
    private EditText gatewayKeyEditText;
    private Button updateKeyButton, grantSMSPermissionBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        gatewaySwich = findViewById(R.id.gatewaySwitch);
        gatewayKeyEditText = findViewById(R.id.gatewayKeyEditText);
        updateKeyButton = findViewById(R.id.updateKeyButton);
        grantSMSPermissionBtn = findViewById(R.id.grantSMSPermissionBtn);


        grantSMSPermissionBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Pls give permissions", Snackbar.LENGTH_SHORT).show();
            }
        });


    }
}