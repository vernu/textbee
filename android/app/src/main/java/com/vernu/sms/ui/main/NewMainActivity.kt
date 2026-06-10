package com.vernu.sms.ui.main

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.vernu.sms.AppConstants
import com.vernu.sms.activities.MainActivity
import com.vernu.sms.helpers.HeartbeatManager
import com.vernu.sms.helpers.SharedPreferenceHelper
import com.vernu.sms.ui.dashboard.DashboardScreen
import com.vernu.sms.ui.messages.ComposeScreen
import com.vernu.sms.ui.messages.MessagesScreen
import com.vernu.sms.ui.onboarding.OnboardingActivity
import com.vernu.sms.ui.settings.SMSFilterScreen
import com.vernu.sms.ui.settings.SettingsScreen
import com.vernu.sms.ui.theme.TextBeeTheme

enum class MainDestination(val label: String, val icon: ImageVector) {
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    MESSAGES("Messages", Icons.Default.Message),
    SETTINGS("Settings", Icons.Default.Settings)
}

class NewMainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TextBeeTheme {
                val navController = rememberNavController()
                MainScaffold(
                    navController = navController,
                    onSwitchToLegacy = {
                        SharedPreferenceHelper.setSharedPreferenceBoolean(
                            this, AppConstants.SHARED_PREFS_USE_NEW_UI_KEY, false
                        )
                        startActivity(
                            Intent(this, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            }
                        )
                    },
                    onDisconnect = {
                        listOf(
                            AppConstants.SHARED_PREFS_DEVICE_ID_KEY,
                            AppConstants.SHARED_PREFS_API_KEY_KEY,
                            AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY,
                            AppConstants.SHARED_PREFS_DEVICE_NAME_KEY,
                            AppConstants.SHARED_PREFS_LAST_HEARTBEAT_MS_KEY
                        ).forEach { key ->
                            SharedPreferenceHelper.clearSharedPreference(this, key)
                        }
                        HeartbeatManager.cancelHeartbeat(this)
                        startActivity(
                            Intent(this, OnboardingActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            }
                        )
                    }
                )
            }
        }
    }
}

@Composable
private fun MainScaffold(
    navController: NavHostController,
    onSwitchToLegacy: () -> Unit,
    onDisconnect: () -> Unit
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = currentRoute != "compose" && currentRoute != "filters"

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 4.dp
                ) {
                    MainDestination.values().forEach { dest ->
                        val selected = currentRoute == dest.name
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(dest.name) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    dest.icon,
                                    contentDescription = dest.label,
                                    modifier = Modifier.size(if (selected) 26.dp else 22.dp)
                                )
                            },
                            label = {
                                Text(
                                    dest.label,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = MaterialTheme.colorScheme.surfaceVariant,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = MainDestination.DASHBOARD.name,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(MainDestination.DASHBOARD.name) {
                DashboardScreen()
            }
            composable(MainDestination.MESSAGES.name) {
                MessagesScreen(
                    onNavigateToCompose = { navController.navigate("compose") }
                )
            }
            composable(MainDestination.SETTINGS.name) {
                SettingsScreen(
                    onSwitchToLegacy = onSwitchToLegacy,
                    onNavigateToFilters = { navController.navigate("filters") },
                    onDisconnect = onDisconnect
                )
            }
            composable("compose") {
                ComposeScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable("filters") {
                SMSFilterScreen(onNavigateBack = { navController.popBackStack() })
            }
        }
    }
}
