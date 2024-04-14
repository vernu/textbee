import Head from 'next/head'

export default function Meta() {
  return (
    <Head>
      <title>TextBee - SMS Gateway</title>
      <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      <meta
        name='description'
        content={`TextBee is an open-source SMS gateway platform built for Android devices.
        It allows businesses to send SMS messages from dashboard or API, receiving SMS messages and forwarding them to a webhook,
        streamlining communication and automating SMS workflows. With its robust features, 
        TextBee is an ideal solution for CRM's, notifications, alerts, two-factor authentication, and various other use cases.
        `}
      />
      <meta
        name='keywords'
        content='android, text, sms, gateway, sms-gateway, open-source foss'
      />
      <meta name='author' content='Israel Abebe Kokiso' />
      <link rel='icon' href='/favicon.ico' />
    </Head>
  )
}
