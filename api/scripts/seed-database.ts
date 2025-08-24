#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminSeed } from '../src/seeds/admin.seed';

async function bootstrap() {
  console.log('🌱 Starting database seeding...');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    console.log('📦 Application created, getting seeder...');
    const seeder = app.get(AdminSeed);
    
    console.log('🚀 Running seed process...');
    await seeder.seed();
    
    console.log('✅ Database seeding completed successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

bootstrap();