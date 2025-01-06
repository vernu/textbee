import Link from 'next/link'
import { MessageSquarePlus, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExternalLinks } from '@/config/external-links'
import { Routes } from '@/config/routes'
import { ThemeProvider } from 'next-themes'
import ThemeToggle from '@/components/shared/theme-toggle'

export default function LandingPageHeader() {
  return (
    <ThemeProvider attribute='class' defaultTheme='system'>
      <header className='sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-[#1A2752] backdrop-blur supports-[backdrop-filter]:bg-white/60'>
        <div className='container flex h-14 items-center justify-between px-2'>
          <Link
            className='flex items-center space-x-2'
            href={Routes.landingPage}
          >
            <MessageSquarePlus className='h-6 w-6 text-blue-500' />
            <span className='font-bold'>
              Text<span className='text-blue-500'>Bee</span>
            </span>
          </Link>
          <nav className='flex items-center space-x-4'>
            <ThemeToggle />

            {/* <Button variant='ghost' size='icon'>
            <Moon className='h-4 w-4' />
            <span className='sr-only'>Toggle theme</span>
          </Button> */}
            <Link
              className='text-sm font-medium hover:text-blue-500'
              href={Routes.contribute}
            >
              Contribute
            </Link>

            <Link
              className='text-sm font-medium hover:text-blue-500'
              href={Routes.dashboard}
            >
              <Button className='bg-blue-500 hover:bg-blue-600 dark:text-white rounded-full'>
                Go to Dashboard
              </Button>
            </Link>
            {/* <Link
            className='text-sm font-medium hover:text-blue-500'
            href='/register'
          >
            Register
          </Link> */}
          </nav>
        </div>
      </header>
    </ThemeProvider>
  )
}
