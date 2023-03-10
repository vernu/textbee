import { Test, TestingModule } from '@nestjs/testing'
import { GatewayController } from './gateway.controller'

describe('GatewayController', () => {
  let controller: GatewayController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
    }).compile()

    controller = module.get<GatewayController>(GatewayController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
