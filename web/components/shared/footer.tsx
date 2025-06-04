import { ExternalLinks } from '@/config/external-links'
import { Routes } from '@/config/routes'
import { MessageSquarePlus, Activity } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className='border-t py-6  bg-gray-50 dark:bg-muted'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
        <div className='flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0'>
          <Image
            src='/images/logo.png'
            alt='textbee Logo'
            width={24}
            height={24}
            className='h-6 w-6 bg-white rounded-full'
          />
          <p className='text-center text-sm leading-loose md:text-left'>
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
        <nav className='flex gap-4 sm:gap-6 flex-col md:flex-row items-center'>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.landingPage}
          >
            Home
          </Link>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.dashboard}
          >
            Dashboard
          </Link>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.downloadAndroidApp}
          >
            Download App
          </Link>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.contribute}
            target='_blank'
          >
            Contribute
          </Link>
          <Link
            className='text-sm font-medium group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors'
            href={Routes.statusPage}
            target='_blank'
          >
            <Activity className='h-3.5 w-3.5 text-green-500 group-hover:animate-pulse' />
            <span className='text-green-700 dark:text-green-400'>Status</span>
          </Link>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.privacyPolicy}
          >
            Privacy Policy
          </Link>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.termsOfService}
          >
            Terms of Service
          </Link>
          <Link
            className='text-sm font-medium hover:text-brand-500'
            href={Routes.refundPolicy}
          >
            Refund Policy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
