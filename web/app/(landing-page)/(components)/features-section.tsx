import { Card } from '@/components/ui/card'
import { Code, Send, Zap, Users } from 'lucide-react'


export default function FeaturesSection() {
  return (
    <section className='container mx-auto py-24 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <div className='mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center'>
        <h2 className='text-3xl font-bold'>Features</h2>
        <p className='max-w-[85%] text-gray-500'>
          The ultimate solution for your messaging needs! Our free open-source
          Android-based SMS Gateway provides you with all the features you need
          to effectively manage your SMS communications.
        </p>
      </div>
      <div className='mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4 mt-12'>
        <Card className='flex flex-col items-center justify-center p-6 text-center'>
          <Send className='h-12 w-12 mb-4 text-blue-500' />
          <h3 className='font-bold'>Send SMS</h3>
          <p className='text-sm '>
            Send SMS to any number from your dashboard or via REST API
          </p>
        </Card>
        <Card className='flex flex-col items-center justify-center p-6 text-center'>
          <Users className='h-12 w-12 mb-4 text-blue-500' />
          <h3 className='font-bold'>Bulk SMS</h3>
          <p className='text-sm text-gray-500'>
            Send SMS to multiple numbers at once
          </p>
        </Card>
        <Card className='flex flex-col items-center justify-center p-6 text-center'>
          <Zap className='h-12 w-12 mb-4 text-blue-500' />
          <h3 className='font-bold'>Free</h3>
          <p className='text-sm text-gray-500'>
            No credit card required to get started.
          </p>
        </Card>
        <Card className='flex flex-col items-center justify-center p-6 text-center'>
          <Code className='h-12 w-12 mb-4 text-blue-500' />
          <h3 className='font-bold'>Open Source</h3>
          <p className='text-sm text-gray-500'>
            The entire codebase is open source and available on GitHub.
          </p>
        </Card>
      </div>
    </section>
  )
}
