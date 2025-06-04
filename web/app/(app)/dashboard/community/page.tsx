import { UsersIcon } from 'lucide-react'
import CommunityLinks from '../(components)/community-links'

export default function CommunityPage() {
  return (
    <div className='flex-1 space-y-6 p-6 md:p-8'>
      <div className='space-y-1'>
        <div className='flex items-center space-x-2'>
          <UsersIcon className='h-6 w-6 text-primary' />
          <h2 className='text-3xl font-bold tracking-tight'>Community</h2>
        </div>
        <p className='text-muted-foreground'>Connect with other users and find support</p>
      </div>

      <div className=''>
        <CommunityLinks />
      </div>
    </div>
  )
}
