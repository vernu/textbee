'use client'

import { useBulkSend } from './use-bulk-send'
import SuccessPanel from './success-panel'
import UploadStep from './step-upload'
import MapStep from './step-map'
import ComposeStep from './step-compose'
import ReviewStep from './step-review'

export default function BulkSend() {
  const bulk = useBulkSend()

  if (bulk.isSuccess) return <SuccessPanel bulk={bulk} />

  return (
    <div className='space-y-4'>
      <UploadStep bulk={bulk} />
      <MapStep bulk={bulk} />
      <ComposeStep bulk={bulk} />
      <ReviewStep bulk={bulk} />
    </div>
  )
}
