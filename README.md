# TextBee - Android SMS Gateway

A simple SMS gateway that allows users to send SMS messages from a web interface or
from their application via a REST API. It utilizes android phones as SMS gateways.

- **Technology stack**: React, Next.js, Node.js, NestJs, MongoDB, Android, Java
- **Link**: [https://textbee.dev](https://textbee.dev/)

![](https://ik.imagekit.io/vernu/textbee/texbee-landing-light.png?updatedAt=1687076964687)

## Usage

1. Go to [textbee.dev](https://textbee.dev) and register or login with your account
2. Install the app on your android phone from [dl.textbee.dev](https://dl.textbee.dev)
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

**Code Snippet**: Curl command to send an SMS message via the REST API

```bash
curl -X POST" https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/sendSMS" \
  -H 'x-api-key: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipients": [ "+251912345678" ],
    "message": "Hello World!"
  }'
```

### Receiving SMS Messages

To receive SMS messages, you can enable the feature from the mobile app. You can then fetch the received SMS messages via the REST API or view them in the dashboard. (Webhook notifications are coming soon)

**Code Snippet**: Few lines of code showing how to fetch received SMS messages via the REST API

```javascript
const API_KEY = 'YOUR_API_KEY';
const DEVICE_ID = 'YOUR_DEVICE_ID';

await axios.get(`https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/getReceivedSMS`, {
  headers: {
    'x-api-key': API_KEY,
  },
});

```

**Code Snippet**: Curl command to fetch received SMS messages

```bash
curl -X GET "https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/getReceivedSMS"\
  -H "x-api-key: YOUR_API_KEY"
```

## Contributing

Contributions are welcome!

1. [Fork](https://github.com/vernu/textbee/fork) the project.
2. Create a feature or bugfix branch from `main` branch.
3. Make sure your commit messages and PR comment summaries are descriptive.
4. Create a pull request to the `main` branch.

## Bug Reporting and Feature Requests

Please feel free to [create an issue](https://github.com/vernu/textbee/issues/new) in the repository for any bug reports or feature requests. Make sure to provide a detailed description of the issue or feature you are requesting and properly label whether it is a bug or a feature request.

Please note that if you discover any vulnerability or security issue, we kindly request that you refrain from creating a public issue. Instead, send an email detailing the vulnerability to textbee.dev@gmail.com.


## For support, feedback, and questions
Feel free to reach out to us at textbee.dev@gmail.com or [Join our Discord server](https://discord.gg/d7vyfBpWbQ)