#!/usr/bin/env node

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { getConnectionToken } = require('@nestjs/mongoose');

async function fixDatabase() {
  console.log('🔧 Fixing database schema issues...');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    const connection = app.get(getConnectionToken());
    const db = connection.db;
    
    console.log('📋 Checking current plans...');
    const plans = await db.collection('plans').find({}).toArray();
    console.log('Current plans:', plans.map(p => ({ name: p.name, polarProductId: p.polarProductId })));
    
    console.log('🧹 Removing polarProductId from existing plans...');
    await db.collection('plans').updateMany(
      { name: { $in: ['free', 'mega'] } },
      { $unset: { polarProductId: "" } }
    );
    console.log('✅ Removed polarProductId from basic plans');
    
    console.log('🗑️ Dropping unique index on polarProductId...');
    try {
      await db.collection('plans').dropIndex('polarProductId_1');
      console.log('✅ Unique index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index does not exist, continuing...');
      } else {
        console.log('⚠️ Error dropping index:', error.message);
      }
    }
    
    console.log('🆔 Creating new sparse index on polarProductId...');
    try {
      await db.collection('plans').createIndex(
        { polarProductId: 1 }, 
        { 
          unique: true, 
          sparse: true, // This allows multiple null/undefined values
          name: 'polarProductId_sparse_1' 
        }
      );
      console.log('✅ New sparse index created');
    } catch (error) {
      console.log('⚠️ Index creation error (may already exist):', error.message);
    }
    
    console.log('🧹 Cleaning up any duplicate plans...');
    const megaPlans = await db.collection('plans').find({ name: 'mega' }).toArray();
    if (megaPlans.length > 1) {
      console.log(`Found ${megaPlans.length} mega plans, keeping the first one...`);
      for (let i = 1; i < megaPlans.length; i++) {
        await db.collection('plans').deleteOne({ _id: megaPlans[i]._id });
      }
    }
    
    console.log('📋 Final plans check...');
    const finalPlans = await db.collection('plans').find({}).toArray();
    console.log('Final plans:', finalPlans.map(p => ({ name: p.name, polarProductId: p.polarProductId })));
    
    console.log('✅ Database schema fixed successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

fixDatabase();