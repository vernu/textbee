import { Injectable, Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AnalyticsModule } from './analytics.module'
import { AnalyticsService } from './analytics.service'

// A DI mistake here would not fail a unit test, it would fail app boot, so the
// wiring is checked directly: the module resolves, and a module that imports
// nothing can still inject the service because AnalyticsModule is global.
@Injectable()
class ConsumerProbe {
  constructor(readonly analytics: AnalyticsService) {}
}

@Module({ providers: [ConsumerProbe] })
class ConsumerModule {}

describe('AnalyticsModule', () => {
  it('provides AnalyticsService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AnalyticsModule],
    }).compile()

    expect(moduleRef.get(AnalyticsService)).toBeInstanceOf(AnalyticsService)
  })

  it('reaches a module that does not import it, because it is global', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AnalyticsModule, ConsumerModule],
    }).compile()

    const probe = moduleRef.get(ConsumerProbe, { strict: false })
    expect(probe.analytics).toBeInstanceOf(AnalyticsService)
  })
})
