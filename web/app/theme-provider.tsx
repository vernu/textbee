'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

// next-themes injects a small inline script to set the theme before paint.
// It must live in the ROOT layout so that script is part of the initial SSR
// document and is never re-rendered during client navigation (re-rendering a
// <script> on the client triggers a React warning and a hydration mismatch).
export default function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
