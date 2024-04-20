# TextBee - Android SMS Gateway

A simple SMS gateway that allows users to send SMS messages from a web interface or
from their application via a REST API. It utilizes android phones as SMS gateways.

- **Technology stack**: React, Next.js, Node.js, NestJs, MongoDB, Android, Java
- **Link**: [https://textbee.dev](https://textbee.dev/)

![](https://ik.imagekit.io/vernu/textbee/texbee-landing-light.png?updatedAt=1687076964687)

## Usage

1. Go to [textbee.dev](https://textbee.dev) and register or login with your account
2. Install the app on your android phone from [textbee.dev/android](https://textbee.dev/android)
3. Open the app and grant the permissions for SMS
4. Go to [textbee.dev/dashboard](https://textbee.dev/dashboard) and click register device/ generate API Key
5. Scan the QR code with the app or enter the API key manually
6. You are ready to send SMS messages from the dashboard or from your application via the REST API

**Code Snippet**: Few lines of code showing how to send an SMS message via the REST API

```javascript
const API_KEY = 'YOUR_API_KEY';
const DEVICE_ID = 'YOUR_DEVICE_ID';

await axios.post(`https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/sendSMS`, {
  recipients: [ '+251912345678' ],
  message: 'Hello World!',
}, {
  headers: {
    'x-api-key': API_KEY,
  },
});

```

## Contributing

Contributions are welcome!

1. Fork the project.
2. Create a feature or bugfix branch from `main` branch.
3. Make sure your commit messages and PR comment summaries are descriptive.
4. Create a pull request to the `main` branch.
