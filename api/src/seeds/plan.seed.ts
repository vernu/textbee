import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from '../billing/schemas/plan.schema';

@Injectable()
export class PlanSeed {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
  ) {}

  async seed() {
    // Check if free plan exists, if not create it
    const existingFreePlan = await this.planModel.findOne({ name: 'free' });
    if (!existingFreePlan) {
      await this.planModel.create({
        name: 'free',
        dailyLimit: 10,
        monthlyLimit: 100,
        bulkSendLimit: 10,
        isActive: true,
        monthlyPrice: 0,
        yearlyPrice: 0,
        polarProductId: 'textbee-free-plan',
        polarMonthlyProductId: 'free',
        polarYearlyProductId: 'free'
      });
      console.log('Free plan created successfully.');
    } else {
      // Update existing free plan
      await this.planModel.updateOne({ name: 'free' }, {
        dailyLimit: 10,
        monthlyLimit: 100,
        bulkSendLimit: 10,
        isActive: true,
        monthlyPrice: 0,
        yearlyPrice: 0,
        polarProductId: 'textbee-free-plan',
        polarMonthlyProductId: 'free',
        polarYearlyProductId: 'free'
      });
      console.log('Free plan updated successfully.');
    }

    // Check if mega plan exists, if not create it
    const existingMegaPlan = await this.planModel.findOne({ name: 'mega' });
    if (!existingMegaPlan) {
      console.log("Mega creating")
      await this.planModel.create({
        name: 'mega',
        dailyLimit: -1, // unlimited
        monthlyLimit: -1, // unlimited
        bulkSendLimit: -1, // unlimited
        isActive: true,
        monthlyPrice: 99900, // $999.00
        yearlyPrice: 999000, // $9990.00
        polarProductId: 'textbee-mega-plan',
        polarMonthlyProductId: 'mega',
        polarYearlyProductId: 'mega'
      });
      console.log('Mega plan created successfully.');
    } else {
      // Update existing mega plan
      console.log("Mega updating")
      await this.planModel.updateOne({ name: 'mega' }, {
        dailyLimit: -1,
        monthlyLimit: -1,
        bulkSendLimit: -1,
        isActive: true,
        monthlyPrice: 99900,
        yearlyPrice: 999000,
        polarProductId: 'textbee-mega-plan',
        polarMonthlyProductId: 'mega',
        polarYearlyProductId: 'mega'
      });
      console.log('Mega plan updated successfully.');
    }
  }
}
