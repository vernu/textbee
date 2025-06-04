'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LogOut, LayoutDashboard, MessageSquarePlus } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Routes } from '@/config/routes'
import ThemeToggle from './theme-toggle'

export default function AppHeader() {
  const session = useSession()
  const router = useRouter()

  const handleLogout = () => {
    signOut()
    router.push(Routes.login)
  }

  const isAuthenticated = useMemo(
    () => session.status === 'authenticated' && session.data?.user,
    [session.status, session.data?.user]
  )

  const AuthenticatedMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage
              src={session.data?.user?.avatar}
              alt={session.data?.user?.name}
            />
            <AvatarFallback>
              {session.data?.user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className='hidden md:block'>
            {session.data?.user?.name?.split(' ')[0]}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuItem className='flex flex-col items-start'>
          <div className='font-medium'>{session.data?.user?.name}</div>
          <div className='text-xs text-muted-foreground'>
            {session.data?.user?.email}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={Routes.dashboard} className='w-full flex items-center'>
            <LayoutDashboard className='mr-2 h-4 w-4' />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className='text-red-600'>
          <LogOut className='mr-2 h-4 w-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='ghost' className='md:hidden' size='icon'>
          <Menu className='h-5 w-5' />
          <span className='sr-only'>Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-[300px] sm:w-[400px]'>
        <nav className='flex flex-col gap-4'>
          {isAuthenticated ? (
            <>
              <div className='flex items-center gap-2 py-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage
                    src={session.data?.user?.avatar}
                    alt={session.data?.user?.name}
                  />
                  <AvatarFallback>
                    {session.data?.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-medium'>{session.data?.user?.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {session.data?.user?.email}
                  </div>
                </div>
              </div>
              <Link
                href={Routes.dashboard}
                className='flex items-center gap-2 py-2'
              >
                <LayoutDashboard className='h-4 w-4' />
                Dashboard
              </Link>
              <Link
                href={Routes.contribute}
                className='flex items-center gap-2 py-2'
              >
                <MessageSquarePlus className='h-4 w-4' />
                Contribute
              </Link>
              <Button
                onClick={handleLogout}
                variant='ghost'
                className='justify-start text-red-600'
              >
                <LogOut className='mr-2 h-4 w-4' />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant='ghost' className='justify-start'>
                <Link href={Routes.login}>Log in</Link>
              </Button>
              <Button
                asChild
                color='primary'
                className='bg-primary hover:bg-primary/90 text-white rounded-full'
              >
                <Link href={Routes.register}>Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 flex'>
          <Link
            className='flex items-center space-x-2'
            href={Routes.landingPage}
          >
            <Image
              src='/images/logo.png'
              alt='textbee Logo'
              width={24}
              height={24}
              className='h-6 w-6 bg-white rounded-full'
            />
            <span className='font-bold'>
              text<span className='text-primary'>bee</span>
              <span className='text-xs align-center text-gray-500 dark:text-gray-400'>
                .dev
              </span>
            </span>
          </Link>
        </div>
        <div className='flex flex-1 items-center justify-end space-x-2'>
          <nav className='flex items-center space-x-6'>
            <ThemeToggle />
            <Link
              href={Routes.contribute}
              className='items-center gap-2 pr-8 hidden md:block'
            >
              <Button variant='outline' className='px-4 py-2 text-sm'>
                Contribute
              </Button>
            </Link>

            {isAuthenticated ? (
              <AuthenticatedMenu />
            ) : (
              <div className='hidden md:flex md:items-center md:gap-2'>
                <Button asChild variant='ghost'>
                  <Link href={Routes.login}>Log in</Link>
                </Button>
                <Button
                  asChild
                  className='bg-primary hover:bg-primary/90 text-white rounded-full'
                >
                  <Link href={Routes.register}>Get started</Link>
                </Button>
              </div>
            )}
            <MobileMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}
