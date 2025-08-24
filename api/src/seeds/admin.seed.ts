import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-roles.enum';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { BillingService } from '../billing/billing.service';
import { InjectModel } from '@nestjs/mongoose';
import { Plan, PlanDocument } from '../billing/schemas/plan.schema';
import { Model } from 'mongoose';
import { PlanSeed } from './plan.seed';

@Injectable()
export class AdminSeed {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly billingService: BillingService,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    private readonly planSeed: PlanSeed,
  ) {}

  async seed() {
    await this.planSeed.seed();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    let adminUser = await this.usersService.findOne({ email: adminEmail });

    if (!adminUser) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'password';
      const adminName = 'Admin';

      // Register the user using AuthService.register
      const { user } = await this.authService.register({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });

      // Assign ADMIN role
      user.role = UserRole.ADMIN;
      adminUser = await user.save();

      console.log('Admin user created successfully.');
    }

    // Check if the user has an active subscription
    const subscription = await this.billingService.getActiveSubscription(adminUser._id.toString());
    if (subscription && subscription.plan.name !== 'free') {
      return;
    }

    // Assign the best plan
    const bestPlan = await this.planModel.findOne({ name: 'mega' });
    if (bestPlan) {
      await this.billingService.switchPlan({
        userId: adminUser._id.toString(),
        newPlanName: bestPlan.name,
        status: 'active',
        amount: bestPlan.monthlyPrice,
      });
      console.log(`Admin user subscribed to ${bestPlan.name} plan.`);
    } else {
      console.warn('No unlimited plan found to assign to admin user. Defaulting to free plan.');
    }
  }
}