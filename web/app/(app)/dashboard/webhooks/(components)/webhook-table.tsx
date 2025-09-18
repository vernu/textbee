'use client'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { DataTable } from './data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

interface ProductClientProps {
  data: ProductColumns[]
}

export type ProductColumns = {
  event?: string
  deviceName?: string
  webhookEvent?: string
  deliveryUrl?: string
  webhookSubscription?: {
    deliveryUrl: string
  }
  createdAt?: string
  status: string
}

export const columns: ColumnDef<ProductColumns>[] = [
  {
    accessorKey: 'event',
    header: 'Event',
  },
  {
    accessorKey: 'deviceName',
    header: 'Device',
    cell: ({ row }) => {
      const deviceName = row.original.deviceName
      // If deviceName is an array with two lines
      if (Array.isArray(deviceName) && deviceName.length === 2) {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{deviceName[0]}</span>
            <span className="text-xs text-muted-foreground">
              {deviceName[1]}
            </span>
          </div>
        )
      }
      // Fallback for single line
      return <span>{deviceName}</span>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'webhookSubscriptionData.deliveryUrl',
    header: 'Delivery Url',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
  },
]
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy h:mm a')
}
const ProductClient = ({ data, isLoading, status = 'delivered' }) => {
  const { storeId } = useParams()
  const router = useRouter()

  const formatted = data.map((d) => ({
    ...d,
    deviceName: [
      `${d.deviceData.brand}   ${d.deviceData.model}`,
      `  ${d.smsData._id}`,
    ],
    createdAt: formatDate(d.createdAt.toString()),
    status,
  }))

  return (
    <>
      <DataTable
        searchKey="event"
        columns={columns}
        data={formatted}
        isLoading={isLoading}
      />
    </>
  )
}

export default ProductClient
