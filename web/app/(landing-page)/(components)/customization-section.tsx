import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import Link from 'next/link'

export default function CustomizationSection() {
  return (
    <section className='py-24 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-muted'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <div className='mx-auto max-w-4xl text-center mb-12'>
          <h2 className='text-4xl font-bold mb-4 text-blue-600'>
            Custom Development Solutions
          </h2>
          <p className='text-xl text-gray-600 mb-8'>
            Need help with TextBee or other development projects? We offer expertise in:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-600 mb-3">Self-Hosting Setup</h3>
              <p className="text-gray-600 dark:text-gray-300">Get assistance deploying TextBee on your own infrastructure.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-600 mb-3">Custom Integrations</h3>
              <p className="text-gray-600 dark:text-gray-300">Integrate TextBee with your existing applications or workflows.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-600 mb-3">Development Projects</h3>
              <p className="text-gray-600 dark:text-gray-300">Collaborate with our team on your software development needs beyond TextBee.</p>
            </div>
          </div>
          
          <Link
            href={`mailto:contact@textbee.dev?subject=Custom Development Inquiry&body=I'm interested in discussing the following custom solution:%0A%0A- [ ] Self-hosting setup%0A- [ ] Custom integrations%0A- [ ] Other development project%0A%0AProject details:%0A%0A`}
          >
            <Button
              size='lg'
              className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105'
            >
              Let's Discuss Your Project
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
