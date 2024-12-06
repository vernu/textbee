import Image from 'next/image'
import { Button } from '../../../components/ui/button'
import Link from 'next/link'
import { Routes } from '@/config/routes'

export default function DownloadAppSection() {
  return (
    <section className='container mx-auto py-24 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <div className='mx-auto max-w-[58rem] text-center'>
        <div className='rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 dark:from-blue-950 dark:to-muted'>
          <div className='mx-auto max-w-sm'>
            <Image
              alt='App preview'
              className='mx-auto mb-8 rounded-xl shadow-lg'
              height='400'
              src='/images/smsgatewayandroid.png'
              width='200'
            />
            <h3 className='text-xl font-bold mb-2'>
              Download the App to get started!
            </h3>
            <p className='text-gray-500 mb-4'>
              Unlock the power of messaging with our open-source Android SMS
              Gateway.
            </p>
            <Link href={Routes.downloadAndroidApp} prefetch={false}>
              <Button className='bg-blue-500 hover:bg-blue-600 text-white'>
                Download App
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
