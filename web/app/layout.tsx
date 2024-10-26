import { PropsWithChildren } from 'react'
import '@/styles/main.css'

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en'>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
