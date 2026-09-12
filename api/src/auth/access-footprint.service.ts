import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument } from '../users/schemas/user.schema'
import {
  canonicalAddress,
  resolveClientAddress,
} from '../common/client-address'
import {
  AccessChannel,
  RecentKeys,
  classifyChannel,
  classifyClient,
} from './access-footprint'
import {
  AccessFootprint,
  AccessFootprintDocument,
} from './schemas/access-footprint.schema'

// An origin already recorded is not written again for this long. The row's
// lastSeenAt is therefore accurate to within the window, which is all a report
// over days or months needs.
const REFRESH_WINDOW_MS = 60 * 60 * 1000

// Ceiling on the keys held in memory. Reaching it costs an extra write for the
// evicted origin, never a wrong result.
const MAX_TRACKED_KEYS = 50_000

// Most distinct origins recorded per account and channel. An account behind a
// large NAT pool or a rotating egress can genuinely reach this; past it the
// known origins still refresh and new ones are not added, so one account can
// never grow the collection without bound.
const MAX_ORIGINS_PER_CHANNEL = 1000

const DUPLICATE_KEY = 11000

/**
 * Records the distinct origins an account is used from.
 *
 * Called from the guards on every authenticated request, so the common path
 * must cost nothing: an origin already seen in this process within the refresh
 * window returns before any query. A first sighting costs one upsert plus one
 * update of the account's summary.
 */
@Injectable()
export class AccessFootprintService {
  private readonly logger = new Logger(AccessFootprintService.name)
  private readonly recent = new RecentKeys<true>(
    REFRESH_WINDOW_MS,
    MAX_TRACKED_KEYS,
  )
  private readonly counts = new RecentKeys<number>(
    REFRESH_WINDOW_MS,
    MAX_TRACKED_KEYS,
  )

  constructor(
    @InjectModel(AccessFootprint.name)
    private footprintModel: Model<AccessFootprintDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Read at call time, so unsetting it and restarting is enough to stop.
  private isEnabled(): boolean {
    return process.env.ACCESS_FOOTPRINTS !== 'off'
  }

  /**
   * Never awaited by the guards and never throws: a request must not fail
   * because this could not be written.
   */
  record({ request }: { request: any }): void {
    if (!this.isEnabled()) return
    const userId = request?.user?._id
    if (!userId) return

    // A route that stacks both guards would otherwise record twice.
    if (request.accessTracked) return
    request.accessTracked = true

    const { ip: rawIp, country } = resolveClientAddress(request)
    const ip = canonicalAddress(rawIp)
    if (!ip) return

    const sdkClient = headerValue(request.headers?.['x-sdk-client'])
    const channel = classifyChannel({
      hasBearer: Boolean(request.headers?.authorization?.startsWith('Bearer ')),
      path: request.originalUrl ?? request.url,
      sdkClient,
    })

    const key = `${userId}|${channel}|${ip}`
    if (this.recent.has(key)) return
    this.recent.remember(key)

    const client = classifyClient({
      sdkClient,
      userAgent: headerValue(request.headers?.['user-agent']),
    })

    this.write({
      userId,
      channel,
      ip,
      country,
      client,
      apiKeyId: request.apiKey?._id,
      addressesSeen: request.user?.access?.addressesSeen ?? 0,
    }).catch((error) => {
      // The key is dropped so the next request retries rather than waiting out
      // the window on a write that never landed.
      this.recent.forget(key)
      if (error?.code === DUPLICATE_KEY) return
      this.logger.warn(
        `Failed to record an access origin: ${error?.message ?? error}`,
      )
    })
  }

  private async write({
    userId,
    channel,
    ip,
    country,
    client,
    apiKeyId,
    addressesSeen,
  }: {
    userId: any
    channel: AccessChannel
    ip: string
    country?: string
    client?: string
    apiKeyId?: any
    addressesSeen: number
  }): Promise<void> {
    const now = new Date()
    const atCeiling =
      addressesSeen >= MAX_ORIGINS_PER_CHANNEL &&
      (await this.channelCount(userId, channel)) >= MAX_ORIGINS_PER_CHANNEL

    const result = await this.footprintModel.updateOne(
      { user: userId, channel, ip },
      {
        $setOnInsert: { firstSeenAt: now },
        $set: {
          lastSeenAt: now,
          ...(country && { country }),
          ...(client && { client }),
          ...(apiKeyId && { apiKey: apiKeyId }),
        },
      },
      // At the ceiling a known origin still refreshes; a new one is not added.
      { upsert: !atCeiling },
    )

    const added = result.upsertedCount > 0
    if (!added && !result.matchedCount) return
    if (added) this.counts.forget(`${userId}|${channel}`)

    // Runs on a refresh too, not only on an insert. An address can be placed
    // in a different region later, and the summary would otherwise keep the
    // region it was first seen in while the row itself moved on. $addToSet
    // makes the repeat a no-op, and this only runs once an hour per origin.
    //
    // The counter is incremented only for a new row. If this update fails
    // after the row was written the counter runs low, which is the safe
    // direction: it is a pre-check before an exact count, so a low value
    // means the ceiling is checked properly rather than applied early.
    await this.userModel.updateOne(
      { _id: userId },
      {
        ...(added && { $inc: { 'access.addressesSeen': 1 } }),
        $addToSet: {
          'access.channels': channel,
          ...(country && { 'access.countries': country }),
        },
        $set: { 'access.updatedAt': now },
      },
    )
  }

  /** Counted from the collection, not from the summary, which never shrinks. */
  private async channelCount(
    userId: any,
    channel: AccessChannel,
  ): Promise<number> {
    const key = `${userId}|${channel}`
    const cached = this.counts.get(key)
    if (cached !== undefined) return cached

    const count = await this.footprintModel.countDocuments({
      user: userId,
      channel,
    })
    this.counts.remember(key, count)
    return count
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
