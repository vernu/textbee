import 'dotenv/config'
import { VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as firebase from 'firebase-admin'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(AppModule)
  const PORT = process.env.PORT || 3001

  app.setGlobalPrefix('api')
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })

  const config = new DocumentBuilder()
    .setTitle('TextBee API Docs')
    .setDescription('TextBee - Android SMS Gateway API Docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
    })
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const firebaseConfig = {
    type: 'service_account',
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: 'https://accounts.google.com/o/oauth2/auth',
    tokenUri: 'https://oauth2.googleapis.com/token',
    authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
    clientC509CertUrl: process.env.FIREBASE_CLIENT_C509_CERT_URL,
  }

  firebase.initializeApp({
    credential: firebase.credential.cert(firebaseConfig),
  })

  app.use(
    '/api/v1/billing/webhook/polar',
    express.raw({ type: 'application/json' }),
  )
  app.useBodyParser('json', { limit: '2mb' });
  app.enableCors()
  await app.listen(PORT)
}
bootstrap()
