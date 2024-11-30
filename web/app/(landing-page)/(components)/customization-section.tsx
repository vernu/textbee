import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import Link from 'next/link'

export default function CustomizationSection() {
  return (
    <section className='py-24 bg-gradient-to-b from-blue-50 to-white'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <div className='mx-auto max-w-3xl text-center mb-12'>
          <h2 className='text-4xl font-bold mb-4 text-blue-600'>
            Request Custom Solutions
          </h2>
          <p className='text-xl text-gray-600 mb-8'>
            Let&apos;s explore how we can customize TextBee to align perfectly
            with your business requirements. Whether you&apos;re looking for new
            features or need assistance in deploying the platform on your own
            server, or need dedicated support we&apos;re here to help.
          </p>
          <Link
            href={`mailto:contact@textbee.dev?subject=Customization Request&body=I am interested in discussing paid solutions for TextBee.`}
          >
            <Button
              size='lg'
              className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105'
              // onClick={() => setCustomizationOpen(true)}
            >
              Discuss Custom Solutions
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
