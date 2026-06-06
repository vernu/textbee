package com.vernu.sms.ui.dashboard

import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vernu.sms.R
import com.vernu.sms.dtos.SubscriptionResponse
import com.vernu.sms.dtos.UserProfile
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_app_logo),
                            contentDescription = null,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "textbee.dev",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))
            UserGreetingHeader(userProfile = state.userProfile)
            DeviceStatusCard(state = state, onToggle = { viewModel.toggleGateway(it) })
            StatsSection(state = state)
            SubscriptionCard(
                subscription = state.subscription,
                isLoading = state.isSubscriptionLoading,
                unavailable = state.subscriptionUnavailable
            )
            QuickActionsSection()
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun UserGreetingHeader(userProfile: UserProfile?) {
    val displayName = userProfile?.name?.takeIf { it.isNotBlank() }
        ?: userProfile?.email?.takeIf { it.isNotBlank() }
        ?: return

    Text(
        text = "Hello, $displayName",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun DeviceStatusCard(
    state: DashboardState,
    onToggle: (Boolean) -> Unit
) {
    val statusColor = if (state.isGatewayEnabled) MaterialTheme.colorScheme.primary
                     else MaterialTheme.colorScheme.onSurfaceVariant
    val statusText = if (state.isGatewayEnabled) "Enabled" else "Disabled"

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val hardwareModel = "${Build.BRAND.replaceFirstChar { it.uppercase() }} ${Build.MODEL}"
                val customName = state.deviceName.trim()
                val displayName = customName.ifEmpty { hardwareModel }
                val showModel = customName.isNotEmpty() &&
                                customName.lowercase() != hardwareModel.lowercase()

                Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                    Text(
                        text = displayName,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (showModel) {
                        Text(
                            text = hardwareModel,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (state.deviceId.isNotEmpty()) {
                        Text(
                            text = state.deviceId,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        )
                    }
                }
                Switch(
                    checked = state.isGatewayEnabled,
                    onCheckedChange = onToggle,
                    enabled = !state.isTogglingGateway
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Surface(
                color = statusColor.copy(alpha = 0.15f),
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = statusText,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelMedium,
                    color = statusColor,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun SubscriptionCard(
    subscription: SubscriptionResponse?,
    isLoading: Boolean,
    unavailable: Boolean
) {
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        when {
            isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                }
            }
            unavailable || subscription == null -> {
                // silently hide rather than show an error card
            }
            else -> {
                Column(modifier = Modifier.padding(20.dp)) {
                    val planName = subscription.plan?.name?.uppercase() ?: "FREE"
                    val isFree = subscription.plan?.name?.lowercase() == "free" ||
                                 subscription.plan?.name == null

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Subscription",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Surface(
                                color = if (isFree) MaterialTheme.colorScheme.surfaceVariant
                                        else MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                shape = MaterialTheme.shapes.small
                            ) {
                                Text(
                                    text = planName,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isFree) MaterialTheme.colorScheme.onSurfaceVariant
                                            else MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        if (isFree) {
                            OutlinedButton(
                                onClick = {
                                    context.startActivity(
                                        Intent(Intent.ACTION_VIEW, Uri.parse("https://textbee.dev/pricing"))
                                    )
                                }
                            ) {
                                Text("Upgrade")
                            }
                        } else {
                            TextButton(
                                onClick = {
                                    context.startActivity(
                                        Intent(Intent.ACTION_VIEW, Uri.parse("https://app.textbee.dev/dashboard/account"))
                                    )
                                }
                            ) {
                                Text("Manage")
                            }
                        }
                    }

                    if (isFree) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Unlock higher limits, more devices & priority support",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        subscription.usage?.let { usage ->
                            Spacer(modifier = Modifier.height(16.dp))
                            UsageRow(
                                label = "Today",
                                used = usage.processedSmsToday,
                                limit = usage.dailyLimit,
                                pct = usage.dailyUsagePercentage
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            UsageRow(
                                label = "This month",
                                used = usage.processedSmsLastMonth,
                                limit = usage.monthlyLimit,
                                pct = usage.monthlyUsagePercentage
                            )
                        }

                        subscription.currentPeriodEnd?.let { dateStr ->
                            formatDate(dateStr)?.let { formatted ->
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "Renews $formatted",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UsageRow(label: String, used: Int?, limit: Int?, pct: Int?) {
    val isUnlimited = limit == -1
    val progress = if (isUnlimited || limit == null || limit == 0) 0f
                   else (pct ?: 0).coerceIn(0, 100) / 100f

    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                text = if (isUnlimited) "${used ?: 0} / ∞"
                       else "${used ?: 0} / ${limit ?: "—"}",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        if (!isUnlimited && limit != null && limit > 0) {
            LinearProgressIndicator(
                progress = progress,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = if (progress > 0.8f) MaterialTheme.colorScheme.error
                        else MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }
    }
}

@Composable
private fun StatsSection(state: DashboardState) {
    Text(
        text = "All-Time Stats",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold
    )

    when {
        state.isStatsLoading -> {
            Card(modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                }
            }
        }
        state.statsUnavailable -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Text(
                    text = "Stats unavailable",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        else -> {
            val stats = state.stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(label = "Total Sent", value = stats?.totalSentSMS?.toString() ?: "—", modifier = Modifier.weight(1f))
                StatCard(label = "Total Received", value = stats?.totalReceivedSMS?.toString() ?: "—", modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun QuickActionsSection() {
    val context = LocalContext.current

    Text(
        text = "Quick Actions",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold
    )
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedButton(
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://app.textbee.dev/dashboard"))
                )
            },
            modifier = Modifier.weight(1f)
        ) {
            Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Dashboard")
        }
        OutlinedButton(
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://textbee.dev/docs"))
                )
            },
            modifier = Modifier.weight(1f)
        ) {
            Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Explore Docs")
        }
    }
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedButton(
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://app.textbee.dev/dashboard/account/get-support"))
                )
            },
            modifier = Modifier.weight(1f)
        ) {
            Icon(Icons.Default.SupportAgent, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Get Support")
        }
        OutlinedButton(
            onClick = {
                val shareText = "i've been using textbee.dev to send SMS via API from my own phone, " +
                    "no Twilio or paid services needed. works great for automations, alerts, " +
                    "notifications, or anything that needs programmatic SMS. open source and free to start\n\n" +
                    "https://textbee.dev"
                context.startActivity(
                    Intent.createChooser(
                        Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        },
                        "Share TextBee"
                    )
                )
            },
            modifier = Modifier.weight(1f)
        ) {
            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Share")
        }
    }
}

private fun formatDate(isoDate: String): String? {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        val date = sdf.parse(isoDate.take(19)) ?: return null
        SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(date)
    } catch (e: Exception) {
        null
    }
}
