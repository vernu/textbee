# Android Build Variants Setup (Dev vs Prod)

This document explains how to use the dev and prod build variants for the SMS Gateway Android app.

## Overview

The app now supports two build variants:
- **Dev**: For development and testing
- **Prod**: For production releases

## Key Differences

| Feature | Dev | Prod |
|---------|-----|------|
| Package Name | `com.vernu.sms.dev` | `com.vernu.sms` |
| App Name | "SMS Gateway (Dev)" | "SMS Gateway" |
| API Base URL | `https://api-dev.textbee.dev/api/v1/` | `https://api.textbee.dev/api/v1/` |
| Firebase Config | `app/src/dev/google-services.json` | `app/src/prod/google-services.json` |
| Version Suffix | `-dev` appended | No suffix |

## Setup Instructions

### 1. Firebase Configuration

#### For Production:
- The current `google-services.json` has been moved to `app/src/prod/google-services.json`
- No changes needed if you're already using the production Firebase project

#### For Development:
- Create a new Firebase project for development
- Download the `google-services.json` for your dev project
- **Important**: Make sure the package name in Firebase is set to `com.vernu.sms.dev`
- Replace the template file at `app/src/dev/google-services.json` with your actual dev configuration

### 2. API Configuration

The API base URLs are now configured via build variants:
- **Dev**: `https://api-dev.textbee.dev/api/v1/`
- **Prod**: `https://api.textbee.dev/api/v1/`

To change the dev API URL, edit the `buildConfigField` in `app/build.gradle`:
```gradle
dev {
    buildConfigField "String", "API_BASE_URL", '"https://api-dev.textbee.dev/api/v1/"'
}
```

## Building the App

### Using Android Studio:
1. Open the "Build Variants" panel (View → Tool Windows → Build Variants)
2. Select the desired variant:
   - `devDebug` - Development build for debugging
   - `devRelease` - Development release build
   - `prodDebug` - Production build for debugging
   - `prodRelease` - Production release build

### Using Command Line:
```bash
# Build dev debug
./gradlew assembleDevDebug

# Build dev release
./gradlew assembleDevRelease

# Build prod debug
./gradlew assembleProdDebug

# Build prod release
./gradlew assembleProdRelease
```

## Installation

Both variants can be installed simultaneously on the same device since they have different package names:
- Dev app will show as "SMS Gateway (Dev)"
- Prod app will show as "SMS Gateway"

## Environment Detection

You can detect which environment the app is running in using:
```java
if (BuildConfig.ENVIRONMENT.equals("development")) {
    // Development-specific code
} else {
    // Production code
}
```

## Important Notes

1. **Different Package Names**: Dev and prod apps are completely separate and can coexist
2. **Separate Data**: Each variant maintains its own app data and preferences
3. **Firebase Projects**: Use separate Firebase projects for dev and prod
4. **API Endpoints**: Ensure your backend has corresponding dev/prod endpoints
5. **Testing**: Always test the prod build before releasing

## Troubleshooting

### Build Errors:
- Ensure both `google-services.json` files are properly configured
- Check that package names match between Firebase console and app configuration
- Verify API URLs are accessible

### Firebase Issues:
- Confirm the package name in Firebase matches the variant (`com.vernu.sms.dev` for dev)
- Ensure SHA-1 fingerprints are added to Firebase if using authentication 