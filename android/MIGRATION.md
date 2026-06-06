# Android Kotlin/Compose Migration

## Overview

TextBee Android is mid-migration from a Java/XML legacy codebase to Kotlin + Jetpack Compose. The new UI runs in parallel with the legacy UI — users can switch between them via Settings. The SplashActivity routes to the appropriate UI on launch.

---

## What's Done

### Theme
| File | Notes |
|---|---|
| `ui/theme/Color.kt` | Brand orange (`#C4620A`), full light/dark palette |
| `ui/theme/Theme.kt` | `TextBeeTheme` wrapper, `dynamicColor = false` to preserve brand color |
| `ui/theme/Type.kt` | Material3 typography scale |

### Infrastructure
| File | Notes |
|---|---|
| `ApiManagerKt.kt` | Kotlin singleton Retrofit client, mirrors `ApiManager.java` |
| `services/GatewayApiServiceKt.kt` | Kotlin suspend-function Retrofit interface (all new UI endpoints) |
| `dtos/GatewayStatsResponse.kt` | Nullable stats DTO |
| `dtos/SubscriptionResponse.kt` | Plan, usage, renewal DTO |
| `dtos/UserProfileResponse.kt` | `name`, `email` from `/auth/who-am-i` |
| `dtos/MessagesResponse.kt` | `SmsMessage`, `PaginationMeta`, `SendSmsRequest` |

### UI — Onboarding
| File | Notes |
|---|---|
| `ui/onboarding/OnboardingActivity.kt` | Compose NavHost shell |
| `ui/onboarding/OnboardingViewModel.kt` | Registration state + API calls |
| `ui/onboarding/screens/WelcomeScreen.kt` | Get Started / I have a Device ID |
| `ui/onboarding/screens/CredentialsScreen.kt` | QR scan + manual API key entry |
| `ui/onboarding/screens/DeviceSetupScreen.kt` | Register or reconnect device |
| `ui/onboarding/screens/PermissionsScreen.kt` | SMS + phone state permissions |
| `ui/onboarding/screens/SetupCompleteScreen.kt` | Success + navigate to dashboard |
| `ui/onboarding/screens/OnboardingComponents.kt` | Shared step indicator, etc. |

### UI — Main App
| File | Notes |
|---|---|
| `ui/splash/SplashActivity.kt` | Routes to legacy/onboarding/main based on SharedPrefs |
| `ui/main/NewMainActivity.kt` | Bottom nav (Dashboard / Messages / Settings) + compose route |
| `ui/dashboard/DashboardScreen.kt` | Device card, stats, subscription, quick actions |
| `ui/dashboard/DashboardViewModel.kt` | Stats, subscription, user profile, gateway toggle |
| `ui/messages/MessagesScreen.kt` | Filter chips, message list, detail dialog, FAB |
| `ui/messages/MessagesViewModel.kt` | Paginated message fetch, filter state |
| `ui/messages/ComposeScreen.kt` | Multi-recipient input, message field, send with snackbar feedback |
| `ui/messages/ComposeViewModel.kt` | Send SMS, error body parsing, success/error state |
| `ui/settings/SettingsScreen.kt` | Account, Gateway, SMS, Legal, System, UI sections |
| `ui/settings/SettingsViewModel.kt` | Device name save, gateway toggle, SIM picker |

---

## What's Left (Java / Legacy)

### Core App
| File | Priority | Notes |
|---|---|---|
| `AppConstants.java` | Low | Constants only — convert when touching other things |
| `SMSGatewayApplication.java` | Low | Application class, minimal logic |
| `TextBeeUtils.java` | Medium | Heavily used utility; convert once helpers are stable |
| `ApiManager.java` | Low | Still used by legacy UI; delete after legacy removal |

### Activities (Legacy UI)
| File | Priority | Notes |
|---|---|---|
| `activities/MainActivity.java` | High | Legacy main UI — remove after full Compose rollout |
| `activities/SMSFilterActivity.java` | High | Only user-facing Java screen still reachable from new UI |

### Database (Room)
| File | Priority | Notes |
|---|---|---|
| `database/local/AppDatabase.java` | Medium | Room DB; convert to Kotlin for coroutine-friendly DAOs |
| `database/local/SMS.java` | Medium | Room entity |
| `database/local/SMSDao.java` | Medium | DAO — high value: Kotlin suspend queries |
| `database/local/DateConverter.java` | Low | Trivial type converter |

### DTOs (Java)
| File | Priority | Notes |
|---|---|---|
| `dtos/RegisterDeviceInputDTO.java` | Medium | Setter-based Java — awkward from Kotlin |
| `dtos/RegisterDeviceResponseDTO.java` | Medium | Uses `Map<String, Object>` for `data` field |
| `dtos/HeartbeatInputDTO.java` | Low | Simple DTO |
| `dtos/HeartbeatResponseDTO.java` | Low | Simple DTO |
| `dtos/SMSDTO.java` | Medium | Core SMS payload |
| `dtos/SMSForwardResponseDTO.java` | Low | Simple DTO |
| `dtos/SimInfoDTO.java` / `SimInfoCollectionDTO.java` | Low | SIM info |

### Helpers
| File | Priority | Notes |
|---|---|---|
| `helpers/SharedPreferenceHelper.java` | High | Called from every ViewModel — Kotlin extension would be cleaner |
| `helpers/HeartbeatHelper.java` | Medium | Heartbeat HTTP logic |
| `helpers/HeartbeatManager.java` | Medium | WorkManager scheduling |
| `helpers/SMSFilterHelper.java` | Medium | Filter rule evaluation |
| `helpers/SMSHelper.java` | Medium | SMS send/receive logic |
| `helpers/VersionTracker.java` | Low | Update check logic |

### Models
| File | Priority | Notes |
|---|---|---|
| `models/SMSFilterRule.java` | Medium | Convert to Kotlin data class |
| `models/SMSPayload.java` | Medium | Convert to Kotlin data class |

### Receivers
| File | Priority | Notes |
|---|---|---|
| `receivers/SMSBroadcastReceiver.java` | Medium | Receives incoming SMS, enqueues worker |
| `receivers/SMSStatusReceiver.java` | Medium | Tracks sent/delivered status |
| `receivers/BootCompletedReceiver.java` | Low | Reschedules heartbeat on boot |

### Services
| File | Priority | Notes |
|---|---|---|
| `services/GatewayApiService.java` | High | Java Retrofit interface — delete after legacy UI removed |
| `services/StickyNotificationService.java` | Medium | Foreground service for persistent notification |
| `services/FCMService.java` | Medium | Firebase push — triggers SMS send |

### Workers
| File | Priority | Notes |
|---|---|---|
| `workers/HeartbeatWorker.java` | Medium | Kotlin coroutines-based rewrite would simplify |
| `workers/SMSReceivedWorker.java` | Medium | Forwards received SMS to API |
| `workers/SMSStatusUpdateWorker.java` | Medium | Polls/updates SMS status |
| `workers/SmsSendWorker.java` | High | Core send logic — most complex worker |

---

## Migration Roadmap

### Phase 3 — SMS Filter Screen *(next up)*
Port `SMSFilterActivity.java` to Compose and integrate it as a nested route inside the Settings tab instead of a separate Activity. This is the only remaining Java screen reachable from the new UI.

**Files:**
- Create `ui/settings/SMSFilterScreen.kt` + `SMSFilterViewModel.kt`
- Reuse filter logic from `SMSFilterHelper.java` (call it from Kotlin until Phase 5)
- Add `"filters"` composable route to `NewMainActivity.kt` NavHost
- Update Settings "Configure Filters" row to navigate to route instead of `startActivity`

---

### Phase 4 — Data Layer
Convert the Room database and DTOs to idiomatic Kotlin. This unlocks suspend-based DAOs and removes the awkward Java setter pattern in DTOs.

**Files:**
- `SMS.java` → `Sms.kt` (data class + `@Entity`)
- `SMSDao.java` → `SmsDao.kt` (suspend functions)
- `AppDatabase.java` → `AppDatabase.kt`
- `RegisterDeviceInputDTO.java` → Kotlin data class (remove setter-based pattern)
- `RegisterDeviceResponseDTO.java` → Kotlin (replace `Map<String, Object>` with proper fields)
- Remaining Java DTOs → Kotlin data classes

---

### Phase 5 — Helpers & Utilities
Convert the shared infrastructure that every component depends on. Do `SharedPreferenceHelper` first since it's the most impactful.

**Order:**
1. `SharedPreferenceHelper.java` → Kotlin object with inline extension helpers
2. `SMSFilterHelper.java` + `SMSHelper.java` → Kotlin (unblocks Phase 3 cleanup)
3. `TextBeeUtils.java` → Kotlin (split into focused util files)
4. `HeartbeatHelper.java` + `HeartbeatManager.java` → Kotlin
5. `models/SMSFilterRule.kt` + `models/SMSPayload.kt` → Kotlin data classes
6. `VersionTracker.java` → Kotlin

---

### Phase 6 — Background Services & Receivers
Rewrite workers and receivers in Kotlin. Workers benefit most from coroutines — the current Java workers use callbacks and `CountDownLatch` workarounds.

**Order:**
1. `BootCompletedReceiver.java` → Kotlin (trivial, good warmup)
2. `SMSBroadcastReceiver.java` → Kotlin
3. `SMSStatusReceiver.java` → Kotlin
4. `HeartbeatWorker.java` → Kotlin coroutine worker
5. `SmsSendWorker.java` → Kotlin coroutine worker (most complex)
6. `SMSReceivedWorker.java` → Kotlin
7. `SMSStatusUpdateWorker.java` → Kotlin
8. `StickyNotificationService.java` → Kotlin
9. `FCMService.java` → Kotlin

---

### Phase 7 — Legacy UI Removal
Once Compose UI is stable and rolled out to all users, remove the legacy UI entirely.

**Steps:**
1. Remove the "Switch to Legacy UI" row from `SettingsScreen.kt`
2. Remove `USE_NEW_UI_KEY` logic from `SplashActivity.kt` (always route to new UI)
3. Delete `activities/MainActivity.java` and its XML layouts
4. Delete `services/GatewayApiService.java` (Java Retrofit interface)
5. Delete `ApiManager.java`
6. Remove "Try New UI" button from any remaining legacy layout XML
7. Clean up `AppConstants.java` — remove `SHARED_PREFS_USE_NEW_UI_KEY`
8. Convert `SMSGatewayApplication.java` → Kotlin

---

## Key Constraints to Keep in Mind

- **`dynamicColor = false`** in `Theme.kt` — Material You overrides the brand orange on Android 12+; must stay false
- **`primaryContainer` avoided** in TopAppBar/nav — causes orange-on-orange in dark mode; use `surface` for bars, `surfaceVariant` for nav indicator
- **Java/Kotlin interop** — Java files call Kotlin objects fine; be careful with `companion object` vs `object` when called from Java
- **WorkManager workers** — must remain `ListenableWorker` subclass; Kotlin workers use `CoroutineWorker` which is the idiomatic replacement for `Worker`
- **`RegisterDeviceInputDTO`** — currently setter-based Java; Kotlin callers use `.apply { setEnabled(true) }` until Phase 4 replaces it with a proper data class
