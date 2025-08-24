import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminSeed } from './seeds/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const seeder = app.get(AdminSeed);
  await seeder.seed();
  await app.close();
}

bootstrap();
