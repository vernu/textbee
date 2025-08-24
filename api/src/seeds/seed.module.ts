import { Module } from '@nestjs/common';
import { AdminSeed } from './admin.seed';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from '../billing/schemas/plan.schema';
import { PlanSeed } from './plan.seed';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    BillingModule,
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  providers: [AdminSeed, PlanSeed],
  exports: [AdminSeed, PlanSeed],
})
export class SeedModule {}