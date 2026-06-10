package com.vernu.sms.ui.onboarding.screens

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PermissionsScreen(
    onContinue: () -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current

    val permissions = remember {
        listOf(
            PermissionItem(
                permission = Manifest.permission.SEND_SMS,
                label = "Send SMS",
                rationale = "Required to send messages from your device",
                icon = Icons.Default.Sms
            ),
            PermissionItem(
                permission = Manifest.permission.RECEIVE_SMS,
                label = "Receive SMS",
                rationale = "Required to receive and forward incoming messages",
                icon = Icons.Default.Sms
            ),
            PermissionItem(
                permission = Manifest.permission.READ_PHONE_STATE,
                label = "Phone State",
                rationale = "Required to detect SIM cards for multi-SIM support",
                icon = Icons.Default.PhoneAndroid
            )
        )
    }

    var grantedMap by remember {
        mutableStateOf(
            permissions.associate { item ->
                item.permission to (ContextCompat.checkSelfPermission(context, item.permission) == PackageManager.PERMISSION_GRANTED)
            }
        )
    }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        grantedMap = grantedMap + results
    }

    val allGranted = grantedMap.values.all { it }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            StepIndicator(current = 3, total = 3)

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Grant Permissions",
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "These permissions are required for the SMS gateway to work",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (!allGranted) {
                Button(
                    onClick = {
                        val missing = permissions
                            .filter { grantedMap[it.permission] == false }
                            .map { it.permission }
                            .toTypedArray()
                        launcher.launch(missing)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text("Grant All Permissions")
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            permissions.forEach { item ->
                val isGranted = grantedMap[item.permission] == true
                PermissionRow(
                    item = item,
                    isGranted = isGranted,
                    onGrant = { launcher.launch(arrayOf(item.permission)) },
                    onOpenSettings = {
                        context.startActivity(
                            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                data = Uri.fromParts("package", context.packageName, null)
                            }
                        )
                    }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "These permissions are only used to send and receive SMS on your behalf. textbee never accesses your existing message history.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            TextButton(
                onClick = {
                    context.startActivity(
                        Intent(Intent.ACTION_VIEW, Uri.parse("https://textbee.dev/privacy-policy"))
                    )
                },
                contentPadding = PaddingValues(0.dp)
            ) {
                Text("Privacy Policy", style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onContinue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Text(if (allGranted) "Continue" else "Continue Anyway")
            }

            if (!allGranted) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Some features may be limited without all permissions",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PermissionRow(
    item: PermissionItem,
    isGranted: Boolean,
    onGrant: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isGranted)
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
            else
                MaterialTheme.colorScheme.surfaceVariant
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = null,
                tint = if (isGranted) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.label,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = item.rationale,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            if (isGranted) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = "Granted",
                    tint = MaterialTheme.colorScheme.primary
                )
            } else {
                TextButton(onClick = onGrant) {
                    Text("Grant")
                }
            }
        }
    }
}

private data class PermissionItem(
    val permission: String,
    val label: String,
    val rationale: String,
    val icon: ImageVector
)
