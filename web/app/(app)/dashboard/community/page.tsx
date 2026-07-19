import { UsersIcon } from 'lucide-react'
import PageHeader from '@/components/shared/page-header'
import CommunityLinks from '../(components)/community/community-links'

export default function CommunityPage() {
  return (
    // p-4 on mobile, matching every other dashboard section. This page was the
    // only one still starting at p-6, and the only one absent from the 375px
    // overflow guard, which is presumably how it was missed.
    <div className='flex-1 space-y-6 p-4 sm:p-6 md:p-8'>
      <PageHeader
        icon={UsersIcon}
        title='Community'
        description='Connect with other users and find support'
      />
      <CommunityLinks />
    </div>
  )
}
