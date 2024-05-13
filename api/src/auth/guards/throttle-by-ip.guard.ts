import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class ThrottlerByIpGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return this.extractIP(req)
  }

  private extractIP(req: Record<string, any>): string {
    if (req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for']
    } else if (req.ips.length) {
      return req.ips[0]
    } else {
      return req.ip
    }
  }
}
