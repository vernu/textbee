import SendSms from '../(components)/send-sms'

// Send view: a focused composer. Bulk, history and the API guide live on
// sibling subroutes.
export default function SendPage() {
  return (
    <div className='mx-auto w-full max-w-xl md:mx-0'>
      <SendSms />
    </div>
  )
}
