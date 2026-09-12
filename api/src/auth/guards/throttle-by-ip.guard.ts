import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { canonicalAddress, resolveClientAddress } from '../../common/client-address'

@Injectable()
export class ThrottlerByIpGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return this.extractIP(req)
  }

  private extractIP(req: Record<string, any>): string {
    // The caller as the edge reports it, reduced to one value per network so a
    // client that rotates inside its IPv6 allocation cannot shed its count.
    // The header chain is not read directly: any hop can append to it, and the
    // first entry is whatever the client chose to send.
    const { ip } = resolveClientAddress(req)
    return canonicalAddress(ip) ?? req.ip
  }
}
