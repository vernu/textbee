import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, SchemaTypes, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'
import { ApiKey } from './api-key.schema'

export type AccessFootprintDocument = AccessFootprint & Document

// How long a distinct origin is kept after it was last used.
export const FOOTPRINT_TTL_SECONDS = 180 * 24 * 60 * 60

/**
 * One distinct origin an account has been used from: a channel and an address,
 * with the region the edge placed it in.
 *
 * One document per account, channel and address, never one per request. A
 * repeat from an origin already recorded moves lastSeenAt and writes nothing
 * else, and within the recorder's window it writes nothing at all.
 */
@Schema({ collection: 'accessfootprints', timestamps: false })
export class AccessFootprint {
  _id?: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  user: User | Types.ObjectId

  // web, api or device. See ACCESS_CHANNELS.
  @Prop({ type: String, required: true })
  channel: string

  // IPv4 whole, IPv6 as its /64 network. See canonicalAddress.
  @Prop({ type: String, required: true })
  ip: string

  @Prop({ type: String })
  country?: string

  // Bounded family label for the caller, for example textbee-js or curl.
  @Prop({ type: String })
  client?: string

  // The key this origin presented, when it presented one. A key used from many
  // origins is the signal that it has been copied somewhere unexpected.
  @Prop({ type: SchemaTypes.ObjectId, ref: ApiKey.name })
  apiKey?: ApiKey | Types.ObjectId

  @Prop({ type: Date, required: true })
  firstSeenAt: Date

  @Prop({ type: Date, required: true })
  lastSeenAt: Date
}

export const AccessFootprintSchema =
  SchemaFactory.createForClass(AccessFootprint)

// The identity of a row. Unique so a concurrent first sighting cannot write
// the same origin twice, and the recorder can tell an insert from a refresh.
AccessFootprintSchema.index({ user: 1, channel: 1, ip: 1 }, { unique: true })

// Retention, and the only index the reach report needs: it reads a window of
// lastSeenAt. A TTL index must stand alone, so this cannot be compounded.
AccessFootprintSchema.index(
  { lastSeenAt: 1 },
  { expireAfterSeconds: FOOTPRINT_TTL_SECONDS },
)
