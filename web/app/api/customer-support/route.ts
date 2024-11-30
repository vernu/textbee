import {
  NextRequest,
  NextResponse,
  userAgent,
  userAgentFromString,
} from 'next/server'

import prismaClient from '@/lib/prismaClient'
import { sendMail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for')
  const { browser, device, os, isBot, ua } = userAgent(req)
  //   const userAgentString = userAgentFromString(ua)

  const body = await req.json()

  try {
    const result = await prismaClient.supportMessage.create({
      data: {
        ...body,
        ip,
        userAgent: ua,
      },
    })

    // send email to user
    await sendMail({
      to: body.email,
      cc: process.env.ADMIN_EMAIL,
      subject: `Support request submitted: ${body.category}-${result.id}`,
      html: `<pre>
      <h1>Support request submitted</h1>
      <p>Thank you for contacting us. We will get back to you soon.</p>
      <p>Here is a copy of your message:</p>
      <hr/>
      <h2>Category</h2><br/>${body.category}
      <h2>Message</h2><br/>${body.message}

      <h2>Contact Information</h2>
      <p>Name: ${body.name}</p>
      <p>Email: ${body.email}</p>
      <p>Phone: ${body.phone || 'N/A'}</p>
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
