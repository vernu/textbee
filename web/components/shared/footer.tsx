import { ExternalLinks } from '@/config/external-links'
import { Routes } from '@/config/routes'
import { MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
export default function Footer() {
  return (
    <footer className='border-t py-6  bg-gray-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
        <div className='flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0'>
          <MessageSquarePlus className='h-6 w-6 text-blue-500' />
          <p className='text-center text-sm leading-loose md:text-left'>
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
        <nav className='flex gap-4 sm:gap-6 flex-col md:flex-row items-center'>
          <Link
            className='text-sm font-medium hover:text-blue-500'
            href={Routes.landingPage}
          >
            Home
          </Link>
          <Link
            className='text-sm font-medium hover:text-blue-500'
            href={Routes.dashboard}
          >
            Dashboard
          </Link>
          <Link
            className='text-sm font-medium hover:text-blue-500'
            href={ExternalLinks.patreon}
          >
            Become a Patron
          </Link>
          <Link
            className='text-sm font-medium hover:text-blue-500'
            href={Routes.downloadAndroidApp}
          >
            Download App
          </Link>
          <Link
            className='text-sm font-medium hover:text-blue-500'
            href={ExternalLinks.github}
            target='_blank'
          >
            GitHub
          </Link>
        </nav>
      </div>
    </footer>
  )
}
