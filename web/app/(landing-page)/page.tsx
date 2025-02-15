import DownloadAppSection from '@/app/(landing-page)/(components)/download-app-section'
import FeaturesSection from '@/app/(landing-page)/(components)/features-section'
import HeroSection from '@/app/(landing-page)/(components)/hero-section'
import HowItWorksSection from '@/app/(landing-page)/(components)/how-it-works-section'
import CustomizationSection from '@/app/(landing-page)/(components)/customization-section'
import SupportProjectSection from '@/app/(landing-page)/(components)/support-project-section'
import CodeSnippetSection from '@/app/(landing-page)/(components)/code-snippet-section'
import PricingSection from '@/app/(landing-page)/(components)/pricing-section'
export default function LandingPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <main className='flex-1'>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DownloadAppSection />
        <PricingSection />
        <CustomizationSection />
        <CodeSnippetSection />
        <SupportProjectSection />
      </main>
    </div>
  )
}
