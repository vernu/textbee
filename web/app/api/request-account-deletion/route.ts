import {
  NextRequest,
  NextResponse,
  userAgent,
  userAgentFromString,
} from 'next/server'

import prismaClient from '@/lib/prismaClient'
import { sendMail } from '@/lib/mail'
import { getServerSession, User } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for')
  const { browser, device, os, isBot, ua } = userAgent(req)
  //   const userAgentString = userAgentFromString(ua)

  const body = await req.json()

  const session = await getServerSession(authOptions as any)
  if (!session) {
    return NextResponse.json(
      {
        message: 'You must be logged in to request account deletion',
      },
      { status: 401 }
    )
  }
  // @ts-ignore
  const currentUser = session?.user as User

  if (!currentUser) {
    return NextResponse.json(
      {
        message: 'You must be logged in to request account deletion',
      },
      { status: 401 }
    )
  }

  const category = 'account-deletion'
  const message = body.message ?? 'No message provided'

  try {
    // check if the user has already requested account deletion
    const existingRequest = await prismaClient.supportMessage.findFirst({
      where: {
        user: currentUser.id,
        category: 'account-deletion',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          message: 'You have already requested account deletion',
        },
        { status: 400 }
      )
    }

    const result = await prismaClient.supportMessage.create({
      data: {
        user: currentUser.id,
        category,
        message,
        ip,
        userAgent: ua,
      },
    })

    // send email to user
    await sendMail({
      to: currentUser.email,
      cc: process.env.ADMIN_EMAIL,
      subject: `Account deletion request submitted: ${category}-${result.id}`,
      html: `<pre>
      <h1>Account deletion request submitted</h1>
      <p>Thank you for contacting us. We will get back to you soon.</p>
      <p>Here is a copy of your message:</p>
      <hr/>
      <h2>Category</h2><br/>${category}
      <h2>Message</h2><br/>${message}

      <h2>Contact Information</h2>
      <p>Name: ${currentUser.name}</p>
      <p>Email: ${currentUser.email}</p>
      </pre>`,
    })

    return NextResponse.json({
      message: 'Support request submitted',
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        message: `Support request failed to submit : ${error.message}`,
      },
      { status: 400 }
    )
  }
}
