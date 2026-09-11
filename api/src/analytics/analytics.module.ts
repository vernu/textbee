import { Global, Module } from '@nestjs/common'
import { AnalyticsService } from './analytics.service'
import { MetaCapiService } from './meta-capi.service'

// Global so auth, gateway and billing can report conversions without each
// module importing it.
@Global()
@Module({
  providers: [AnalyticsService, MetaCapiService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
