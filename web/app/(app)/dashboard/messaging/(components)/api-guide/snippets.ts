// Code samples for the API guide.
//
// Every snippet is generated from the user's real device id, so what they copy
// is runnable after pasting one API key. The previous guide always printed
// YOUR_DEVICE_ID, which meant nothing on the page could be run as-is.

export const API_BASE_URL = 'https://api.textbee.dev/api/v1'

export type LanguageId = 'curl' | 'node' | 'python' | 'php' | 'go'

export const LANGUAGES: { id: LanguageId; label: string; highlight: string }[] =
  [
    { id: 'curl', label: 'cURL', highlight: 'bash' },
    { id: 'node', label: 'Node.js', highlight: 'javascript' },
    { id: 'python', label: 'Python', highlight: 'python' },
    { id: 'php', label: 'PHP', highlight: 'php' },
    { id: 'go', label: 'Go', highlight: 'go' },
  ]

export type EndpointId =
  | 'send-sms'
  | 'send-bulk'
  | 'received'
  | 'message-status'

export type Endpoint = {
  id: EndpointId
  title: string
  blurb: string
  method: 'GET' | 'POST'
  path: string
  samples: Record<LanguageId, string>
  response: string
}

const PLACEHOLDER_DEVICE = 'YOUR_DEVICE_ID'

export function buildEndpoints(deviceId?: string): Endpoint[] {
  const id = deviceId || PLACEHOLDER_DEVICE

  return [
    {
      id: 'send-sms',
      title: 'Send an SMS',
      blurb: 'Send one message to one or more recipients.',
      method: 'POST',
      path: `/gateway/devices/${id}/send-sms`,
      samples: {
        curl: `curl -X POST "${API_BASE_URL}/gateway/devices/${id}/send-sms" \\
  -H "x-api-key: $TEXTBEE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipients": ["+14155550101"],
    "message": "Hello from textbee"
  }'`,
        node: `const res = await fetch(
  '${API_BASE_URL}/gateway/devices/${id}/send-sms',
  {
    method: 'POST',
    headers: {
      'x-api-key': process.env.TEXTBEE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients: ['+14155550101'],
      message: 'Hello from textbee',
    }),
  }
)

console.log(await res.json())`,
        python: `import os, requests

res = requests.post(
    '${API_BASE_URL}/gateway/devices/${id}/send-sms',
    headers={'x-api-key': os.environ['TEXTBEE_API_KEY']},
    json={
        'recipients': ['+14155550101'],
        'message': 'Hello from textbee',
    },
)

print(res.json())`,
        php: `<?php
$ch = curl_init('${API_BASE_URL}/gateway/devices/${id}/send-sms');

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'x-api-key: ' . getenv('TEXTBEE_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'recipients' => ['+14155550101'],
        'message' => 'Hello from textbee',
    ]),
]);

echo curl_exec($ch);`,
        go: `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	body := []byte(\`{"recipients":["+14155550101"],"message":"Hello from textbee"}\`)

	req, _ := http.NewRequest("POST",
		"${API_BASE_URL}/gateway/devices/${id}/send-sms",
		bytes.NewBuffer(body))
	req.Header.Set("x-api-key", os.Getenv("TEXTBEE_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	out, _ := io.ReadAll(res.Body)
	fmt.Println(string(out))
}`,
      },
      response: `{
  "data": {
    "success": true,
    "message": "Message queued for delivery",
    "smsBatchId": "665f1c2a9b1e4a0012ab34cd"
  }
}`,
    },
    {
      id: 'send-bulk',
      title: 'Send messages in bulk',
      blurb: 'Send different messages to different recipients in one request.',
      method: 'POST',
      path: `/gateway/devices/${id}/send-bulk-sms`,
      samples: {
        curl: `curl -X POST "${API_BASE_URL}/gateway/devices/${id}/send-bulk-sms" \\
  -H "x-api-key: $TEXTBEE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "recipients": ["+14155550101"], "message": "Hi Alice" },
      { "recipients": ["+16475550187"], "message": "Hi Bob" }
    ]
  }'`,
        node: `const res = await fetch(
  '${API_BASE_URL}/gateway/devices/${id}/send-bulk-sms',
  {
    method: 'POST',
    headers: {
      'x-api-key': process.env.TEXTBEE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { recipients: ['+14155550101'], message: 'Hi Alice' },
        { recipients: ['+16475550187'], message: 'Hi Bob' },
      ],
    }),
  }
)

console.log(await res.json())`,
        python: `import os, requests

res = requests.post(
    '${API_BASE_URL}/gateway/devices/${id}/send-bulk-sms',
    headers={'x-api-key': os.environ['TEXTBEE_API_KEY']},
    json={
        'messages': [
            {'recipients': ['+14155550101'], 'message': 'Hi Alice'},
            {'recipients': ['+16475550187'], 'message': 'Hi Bob'},
        ],
    },
)

print(res.json())`,
        php: `<?php
$ch = curl_init('${API_BASE_URL}/gateway/devices/${id}/send-bulk-sms');

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'x-api-key: ' . getenv('TEXTBEE_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'messages' => [
            ['recipients' => ['+14155550101'], 'message' => 'Hi Alice'],
            ['recipients' => ['+16475550187'], 'message' => 'Hi Bob'],
        ],
    ]),
]);

echo curl_exec($ch);`,
        go: `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	body := []byte(\`{"messages":[
		{"recipients":["+14155550101"],"message":"Hi Alice"},
		{"recipients":["+16475550187"],"message":"Hi Bob"}
	]}\`)

	req, _ := http.NewRequest("POST",
		"${API_BASE_URL}/gateway/devices/${id}/send-bulk-sms",
		bytes.NewBuffer(body))
	req.Header.Set("x-api-key", os.Getenv("TEXTBEE_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()

	out, _ := io.ReadAll(res.Body)
	fmt.Println(string(out))
}`,
      },
      response: `{
  "data": {
    "success": true,
    "smsBatchId": "665f1c2a9b1e4a0012ab34cd",
    "recipientCount": 2
  }
}`,
    },
    {
      id: 'received',
      title: 'Read received messages',
      blurb: 'Poll for SMS your device has received.',
      method: 'GET',
      path: `/gateway/devices/${id}/get-received-sms`,
      samples: {
        curl: `curl "${API_BASE_URL}/gateway/devices/${id}/get-received-sms" \\
  -H "x-api-key: $TEXTBEE_API_KEY"`,
        node: `const res = await fetch(
  '${API_BASE_URL}/gateway/devices/${id}/get-received-sms',
  { headers: { 'x-api-key': process.env.TEXTBEE_API_KEY } }
)

console.log(await res.json())`,
        python: `import os, requests

res = requests.get(
    '${API_BASE_URL}/gateway/devices/${id}/get-received-sms',
    headers={'x-api-key': os.environ['TEXTBEE_API_KEY']},
)

print(res.json())`,
        php: `<?php
$ch = curl_init('${API_BASE_URL}/gateway/devices/${id}/get-received-sms');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['x-api-key: ' . getenv('TEXTBEE_API_KEY')],
]);

echo curl_exec($ch);`,
        go: `package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	req, _ := http.NewRequest("GET",
		"${API_BASE_URL}/gateway/devices/${id}/get-received-sms", nil)
	req.Header.Set("x-api-key", os.Getenv("TEXTBEE_API_KEY"))

	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()

	out, _ := io.ReadAll(res.Body)
	fmt.Println(string(out))
}`,
      },
      response: `{
  "data": [
    {
      "_id": "665f1c2a9b1e4a0012ab34ce",
      "sender": "+14155550101",
      "message": "Reply from a customer",
      "type": "received",
      "status": "received",
      "receivedAt": "2026-07-18T09:14:22.000Z"
    }
  ]
}`,
    },
    {
      id: 'message-status',
      title: 'Check message history',
      blurb: 'List messages for a device with their delivery status.',
      method: 'GET',
      path: `/gateway/devices/${id}/messages`,
      samples: {
        curl: `curl "${API_BASE_URL}/gateway/devices/${id}/messages?page=1&limit=20" \\
  -H "x-api-key: $TEXTBEE_API_KEY"`,
        node: `const url = new URL(
  '${API_BASE_URL}/gateway/devices/${id}/messages'
)
url.searchParams.set('page', '1')
url.searchParams.set('limit', '20')

const res = await fetch(url, {
  headers: { 'x-api-key': process.env.TEXTBEE_API_KEY },
})

console.log(await res.json())`,
        python: `import os, requests

res = requests.get(
    '${API_BASE_URL}/gateway/devices/${id}/messages',
    headers={'x-api-key': os.environ['TEXTBEE_API_KEY']},
    params={'page': 1, 'limit': 20},
)

print(res.json())`,
        php: `<?php
$url = '${API_BASE_URL}/gateway/devices/${id}/messages?page=1&limit=20';
$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['x-api-key: ' . getenv('TEXTBEE_API_KEY')],
]);

echo curl_exec($ch);`,
        go: `package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	req, _ := http.NewRequest("GET",
		"${API_BASE_URL}/gateway/devices/${id}/messages?page=1&limit=20", nil)
	req.Header.Set("x-api-key", os.Getenv("TEXTBEE_API_KEY"))

	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()

	out, _ := io.ReadAll(res.Body)
	fmt.Println(string(out))
}`,
      },
      // Status values match the SMS schema: pending, dispatched, sent,
      // delivered, failed, unknown, received.
      response: `{
  "data": [
    {
      "_id": "665f1c2a9b1e4a0012ab34cd",
      "recipient": "+14155550101",
      "message": "Hello from textbee",
      "type": "sent",
      "status": "delivered",
      "requestedAt": "2026-07-18T09:12:00.000Z",
      "sentAt": "2026-07-18T09:12:03.000Z",
      "deliveredAt": "2026-07-18T09:12:07.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`,
    },
  ]
}
