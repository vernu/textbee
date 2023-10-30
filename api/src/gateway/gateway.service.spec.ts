import { Test, TestingModule } from '@nestjs/testing'
import { GatewayService } from './gateway.service'
import { AuthModule } from '../auth/auth.module'

describe('GatewayService', () => {
  let service: GatewayService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayService],
      imports: [AuthModule],
    }).compile()

    service = module.get<GatewayService>(GatewayService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
