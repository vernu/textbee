package com.vernu.sms.ui.onboarding

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.vernu.sms.ui.main.NewMainActivity
import com.vernu.sms.ui.onboarding.screens.*
import com.vernu.sms.ui.theme.TextBeeTheme

class OnboardingActivity : ComponentActivity() {

    private val viewModel: OnboardingViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val qrLauncher = registerForActivityResult(ScanContract()) { result ->
            result?.contents?.let { scanned ->
                viewModel.onQrScanned(scanned.trim())
            }
        }

        setContent {
            TextBeeTheme {
                val navController = rememberNavController()
                OnboardingNavGraph(
                    navController = navController,
                    viewModel = viewModel,
                    onScanQr = {
                        qrLauncher.launch(ScanOptions().apply {
                            setPrompt("Scan the QR code from textbee.dev/dashboard")
                            setBeepEnabled(true)
                            setOrientationLocked(false)
                        })
                    },
                    onComplete = {
                        val intent = Intent(this, NewMainActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                    }
                )
            }
        }
    }
}

@Composable
private fun OnboardingNavGraph(
    navController: NavHostController,
    viewModel: OnboardingViewModel,
    onScanQr: () -> Unit,
    onComplete: () -> Unit
) {
    NavHost(navController = navController, startDestination = "welcome") {
        composable("welcome") {
            WelcomeScreen(
                onGetStarted = {
                    viewModel.setReturningUser(false)
                    navController.navigate("credentials")
                },
                onHaveDeviceId = {
                    viewModel.setReturningUser(true)
                    navController.navigate("credentials")
                }
            )
        }
        composable("credentials") {
            CredentialsScreen(
                viewModel = viewModel,
                onScanQr = onScanQr,
                onNext = { navController.navigate("device_setup") },
                onBack = { navController.popBackStack() }
            )
        }
        composable("device_setup") {
            DeviceSetupScreen(
                viewModel = viewModel,
                onSuccess = { navController.navigate("permissions") },
                onBack = { navController.popBackStack() }
            )
        }
        composable("permissions") {
            PermissionsScreen(
                onContinue = { navController.navigate("setup_complete") },
                onBack = { navController.popBackStack() }
            )
        }
        composable("setup_complete") {
            SetupCompleteScreen(
                viewModel = viewModel,
                onOpenDashboard = onComplete
            )
        }
    }
}
