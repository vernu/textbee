import 'dotenv/config'
import { VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as firebase from 'firebase-admin'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const PORT = process.env.PORT || 3005

  app.setGlobalPrefix('api')
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })

  const config = new DocumentBuilder()
    .setTitle('VERNU SMS Gateway api docs')
    .setDescription('api docs')
    .setVersion('1.0')
    .addBearerAuth()
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

  app.enableCors()
  await app.listen(PORT)
}
bootstrap()
