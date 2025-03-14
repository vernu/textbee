import Link from 'next/link'
import {
  MessageSquarePlus,
  Moon,
  CreditCard,
  Heart,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Routes } from '@/config/routes'
import { ThemeProvider } from 'next-themes'
import ThemeToggle from '@/components/shared/theme-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
              <span className='text-xs align-center text-gray-500 dark:text-gray-400'>
                .dev
              </span>
            </span>
          </Link>
          <nav className='flex items-center space-x-4'>
            <ThemeToggle />
            <TooltipProvider>
              <Link
                className='text-sm font-medium hover:text-blue-500'
                href={'/#pricing'}
              >
                <span className='hidden sm:inline'>Pricing</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CreditCard className='h-5 w-5 sm:hidden' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pricing</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
              <Link
                className='text-sm font-medium hover:text-blue-500'
                href={Routes.contribute}
              >
                <span className='hidden sm:inline'>Contribute</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Heart className='h-5 w-5 sm:hidden' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contribute</p>
                  </TooltipContent>
                </Tooltip>
              </Link>

              <Link
                className='text-sm font-medium hover:text-blue-500'
                href={Routes.dashboard}
              >
                <Button className='bg-blue-500 hover:bg-blue-600 dark:text-white rounded-full'>
                  <span className='hidden sm:inline'>Go to Dashboard</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <LayoutDashboard className='h-5 w-5 sm:hidden' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to Dashboard</p>
                    </TooltipContent>
                  </Tooltip>
                </Button>
              </Link>
            </TooltipProvider>
          </nav>
        </div>
      </header>
    </ThemeProvider>
  )
}
